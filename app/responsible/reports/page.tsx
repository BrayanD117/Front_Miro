"use client";

import { use, useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Badge, Button, Center, Container, Group, rem, Table, Text, TextInput, Title, Tooltip } from "@mantine/core";
import { dateToGMT } from "@/app/components/DateConfig";
import { IconBulb, IconHistory, IconReportAnalytics } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { usePeriod } from "@/app/context/PeriodContext";
import dayjs from "dayjs";
import "dayjs/locale/es";

interface Report {
  _id: string;
  name: string;
  description: string;
  report_example_id: string;
  report_example_link: string;
  report_example_download: string;
  requires_attachment: boolean;
  file_name: string;
  created_by: {
    email: string;
    full_name: string;
  };
}

interface Dimension {
  _id: string;
  name: string;
}

interface Period {
  _id: string;
  name: string;
  responsible_start_date: Date;
  responsible_end_date: Date;
}

interface DriveFile {
  id: string;
  name: string;
  view_link: string;
  download_link: string;
  folder_id: string;
}

interface User {
  email: string;
  full_name: string;
}

interface FilledReport {
  _id: string;
  dimension: Dimension;
  send_by: any;
  loaded_date: Date;
  report_file: DriveFile;
  attachments: DriveFile[];
  status: string;
  status_date: Date;
  observations: string;
  evaluated_by: User;
}

interface PublishedReport {
  _id: string;
  report: Report;
  dimensions: Dimension[];
  period: Period;
  filled_reports: FilledReport[];
  folder_id: string;
  deadline: Date;
}

const StatusColor: Record<string, string> = {
  Pendiente: "orange",
  "En Borrador": "grape",
  "En Revisión": "cyan",
  Aprobado: "lime",
  Rechazado: "red",
};

const ResponsibleReportsPage = () => {
  const router = useRouter();
  const { selectedPeriodId } = usePeriod();
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [publishedReports, setPublishedReports] = useState<PublishedReport[]>([]);
  const [pendingReportsCount, setPendingReportsCount] = useState<number>(0);
  const [nextDeadline, setNextDeadline] = useState<string | null>(null);

const [validPeriod, setValidPeriod] = useState<{ [key: string]: boolean }>({});
const [loadingPeriodIds, setLoadingPeriodIds] = useState<Set<string>>(new Set());

const validatePeriodDates = async (periodId: string) => {
  if (loadingPeriodIds.has(periodId) || validPeriod[periodId] !== undefined) return;

  setLoadingPeriodIds(prev => new Set(prev.add(periodId)));

  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/periods/byId/${periodId}`);
    const { responsible_start_date, responsible_end_date } = response.data;
    const today = new Date();
    const isValid = today >= new Date(responsible_start_date) && today <= new Date(responsible_end_date);
    setValidPeriod(prev => ({ ...prev, [periodId]: isValid }));
  } catch (error) {
    console.error('Error validating period', error);
  } finally {
    setLoadingPeriodIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(periodId);
      return newSet;
    });
  }
};

useEffect(() => {
  publishedReports.forEach(report => validatePeriodDates(report.period._id));
}, [publishedReports]);



  const fetchReports = async (page: Number, search: String) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/pReports/responsible`,
        {
          params: {
            page: page,
            search: search,
            email: session?.user?.email,
            periodId: selectedPeriodId,
          },
        }
      );  
      if (response.data) {
        const reports = response.data.publishedReports;
        setPublishedReports(reports);
        setPendingReportsCount(response.data.totalPending || 0);

        const pendingReports = reports.filter(
          (pReport: PublishedReport) => !pReport.filled_reports[0] || pReport.filled_reports[0].status === "Pendiente"
        );

        const sortedPendingReports = pendingReports.sort((a: PublishedReport, b: PublishedReport) => {
          return dayjs(a.deadline).isBefore(dayjs(b.deadline)) ? -1 : 1;
        });

        setNextDeadline(
          sortedPendingReports.length > 0
            ? dayjs(sortedPendingReports[0].deadline).format("DD/MM/YYYY")
            : null
        );
      }
    } catch (error) {
      console.error(error);
    }
  };

  

  useEffect(() => {
    if (session?.user?.email) {
      const delayDebounceFn = setTimeout(() => {
        fetchReports(page, search);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [search, session?.user?.email, page, selectedPeriodId]);

  const rows = publishedReports.map((pReport) => (
    <Table.Tr key={pReport._id}>
      <Table.Td>
        <Badge size={rem(12)} h={rem(8)} variant="light" p={"xs"}>
          {pReport.period.name}
        </Badge>
      </Table.Td>
      <Table.Td>{dateToGMT(pReport.deadline)}</Table.Td>
      <Table.Td>
          {pReport.report.name}
      </Table.Td>
      <Table.Td>
        <Center>
          <Badge
            w={rem(110)}
            color={
              StatusColor[pReport.filled_reports[0]?.status] ?? "orange"
            }
            variant={"light"}
          >
            {pReport.filled_reports[0]?.status ?? "Pendiente"}
          </Badge>
        </Center>
      </Table.Td>
      <Table.Td>
        <Center>{pReport.filled_reports[0] ? 
          dateToGMT(pReport.filled_reports[0].status_date) : ""}
        </Center>
      </Table.Td>
      <Table.Td>
  <Center>
    <Tooltip
      label={
        validPeriod[pReport.period._id] === false
          ? `Este informe estará disponible a partir del ${dayjs(pReport.period.responsible_start_date).format("DD/MM/YYYY")}`
          : "Ver informe"
      }
      position="top"
      withArrow
      color={validPeriod[pReport.period._id] === false ? "red" : "blue"}
    >
      <span>
        <Button
          onClick={() => {
            if (validPeriod[pReport.period._id]) {
              router.push(`reports/${pReport._id}`);
            } else {
              alert(
                "No puedes acceder a este informe aún. Solo está disponible entre " +
                  dayjs(pReport.period.responsible_start_date).format("DD/MM/YYYY") +
                  " y " +
                  dayjs(pReport.period.responsible_end_date).format("DD/MM/YYYY")
              );
            }
          }}
          variant="outline"
          color={validPeriod[pReport.period._id] ? "blue" : "gray"}
          disabled={validPeriod[pReport.period._id] === false}
        >
          <IconReportAnalytics size={18} />
        </Button>
      </span>
    </Tooltip>
  </Center>
</Table.Td>

    </Table.Tr>
  ))

  return (
    <Container size="xl">
      <Title ta="center" mb={"md"}>
        Gestión de Informes
      </Title>
      <Center mt="md">
      <Text ta="center" mt="sm" mb="md">
        Tienes <strong>{pendingReportsCount}</strong> reportes pendientes.
        <br />
        {nextDeadline ? `La fecha de vencimiento es el ${nextDeadline}.` : "No hay fecha de vencimiento próxima."}
      </Text>
  </Center>
  <div style={{ marginTop: '20px' }}>
      <TextInput
        placeholder="Buscar en los informes publicados"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
        </div>
      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Periodo</Table.Th>
            <Table.Th>Fecha Límite</Table.Th>
            <Table.Th>Nombre de Informe</Table.Th>
            <Table.Th w={rem(20)}>
              <Center>Estado</Center>
            </Table.Th>
            <Table.Th>
              <Center>Fecha de Estado</Center>
            </Table.Th>
            <Table.Td fw={700}>
              <Center>Ver informe</Center>
            </Table.Td>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? rows :
            <Table.Tr>
              <Table.Td colSpan={10}>No se encontraron informes en el periodo</Table.Td>
            </Table.Tr>
          }
        </Table.Tbody>
      </Table>
      <Text c="dimmed" size="xs" ta="center" mt="md" >
        <IconBulb color="#797979" size={20}></IconBulb>
        <br/>
        Si quieres ver el detalle, historial o cargar un informe, toca el botón de "Ver informe". 
      </Text>
    </Container>
  )
}

export default ResponsibleReportsPage;