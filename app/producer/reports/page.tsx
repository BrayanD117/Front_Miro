"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import {
  Badge,
  Button,
  Center,
  Container,
  Table,
  Text,
  TextInput,
  Title,
  Pagination
} from "@mantine/core";
import DateConfig, { dateToGMT } from "@/app/components/DateConfig";
import { IconBulb, IconReportAnalytics } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { usePeriod } from "@/app/context/PeriodContext";
import dayjs from "dayjs";
import "dayjs/locale/es";

interface Report {
  _id: string;
  name: string;
}

interface Period {
  _id: string;
  name: string;
}

interface User {
  email: string;
  full_name: string;
}

interface DriveFile {
  id: string;
  name: string;
  view_link: string;
  download_link: string;
}

interface FilledReport {
  _id: string;
  send_by: User;
  loaded_date: Date;
  report_file: DriveFile;
  status: string;
  status_date: Date;
}

interface PublishedReport {
  _id: string;
  report: Report;
  period: Period;
  filled_reports: FilledReport[];
  deadline: string | Date;
}

const StatusColor: Record<string, string> = {
  Pendiente: "orange",
  "En Borrador": "grape",
  "En Revisión": "cyan",
  Aprobado: "lime",
  Rechazado: "red",
};

const ProducerReportsPage = () => {
  const router = useRouter();
  const { selectedPeriodId } = usePeriod();
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [publishedReports, setPublishedReports] = useState<PublishedReport[]>([]);
  const [pagePending, setPagePending] = useState(1);
  const [totalPagesPending, setTotalPagesPending] = useState(1);
  const [pageCompleted, setPageCompleted] = useState(1);
  const [totalPagesCompleted, setTotalPagesCompleted] = useState(1);
  const [pendingReportsCount, setPendingReportsCount] = useState<number>(0);
  const [nextDeadline, setNextDeadline] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      const delayDebounceFn = setTimeout(() => {
        fetchReports();
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [search, session?.user?.email, selectedPeriodId, pagePending, pageCompleted]);

  const fetchReports = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/pProducerReports/producer`,
        {
          params: {
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

        // Obtener la fecha de vencimiento más próxima
        const pendingReports = reports.filter(
          (pRep: PublishedReport) => !pRep.filled_reports[0] || pRep.filled_reports[0].status === "Pendiente"
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


  const completedReports = publishedReports.filter((pRep) => {
    const firstReport = pRep.filled_reports[0];
    return firstReport && firstReport.status !== "Pendiente";
  }).slice((pageCompleted - 1) * 5, pageCompleted * 5);


  const renderReportRows = (reports: PublishedReport[]) =>
    reports.map((pRep) => (
      <Table.Tr key={pRep._id}>
        <Table.Td>{pRep.period?.name}</Table.Td>
        <Table.Td>{dateToGMT(pRep.deadline)}</Table.Td>
        <Table.Td>{pRep.report.name}</Table.Td>
        <Table.Td>
          <Center>
            <Badge color={StatusColor[pRep.filled_reports[0]?.status] ?? "orange"} variant={"light"}>
              {pRep.filled_reports[0]?.status ?? "Pendiente"}
            </Badge>
          </Center>
        </Table.Td>
        <Table.Td>
          <Center>
            {pRep.filled_reports[0] ? dateToGMT(pRep.filled_reports[0].status_date) : ""}
          </Center>
        </Table.Td>
        <Table.Td>
          <Center>
            <Button onClick={() => router.push(`reports/${pRep._id}`)} variant="outline" color="blue">
              <IconReportAnalytics size={18} />
            </Button>
          </Center>
        </Table.Td>
      </Table.Tr>
    ));

  return (
    <Container size="xl">
      <DateConfig />

      {/* Reportes Pendientes */}
      <Title ta="center" mb="md">
        Reportes Pendientes
      </Title>
      <Text ta="center" mt="sm" mb="md">
        {pendingReportsCount > 0 ? (
          <>
            Tienes <strong>{pendingReportsCount}</strong> reportes pendientes.
            <br />
            {nextDeadline ? `La fecha de vencimiento es el ${nextDeadline}.` : "No hay fecha de vencimiento próxima."}
          </>
        ) : (
          <>No tienes reportes pendientes.</>
        )}
      </Text>

      <TextInput
        placeholder="Buscar reportes..."
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />

      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Periodo</Table.Th>
            <Table.Th>Fecha Límite</Table.Th>
            <Table.Th>Nombre de Informe</Table.Th>
            <Table.Th>
              <Center>Estado</Center>
            </Table.Th>
            <Table.Th>
              <Center>Fecha de Estado</Center>
            </Table.Th>
            <Table.Th>
              <Center>Ver Informe</Center>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
        {publishedReports.length > 0 ? (
            renderReportRows(publishedReports)
          ) : (
            <Table.Tr>
              <Table.Td colSpan={6} align="center">
                No hay reportes pendientes.
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <Center>
      <Pagination 
          mt={15}
          value={pagePending} 
          onChange={setPagePending} 
          total={totalPagesPending} 
          siblings={1}
          boundaries={3}
  />
      </Center>

      {/* Reportes Entregados */}
      <Title ta="center" mb="md">
        Reportes Entregados
      </Title>

      <Table striped withTableBorder mt="md">
        <Table.Tbody>
          {completedReports.length > 0 ? (
            renderReportRows(completedReports)
          ) : (
            <Table.Tr>
              <Table.Td colSpan={6} align="center">
                No hay reportes entregados.
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>

      <Center>
      <Pagination 
          mt={15}
          value={pagePending} 
          onChange={setPagePending} 
          total={totalPagesPending} 
          siblings={1}
          boundaries={3}
  />
      </Center>
    </Container>
  );
};

export default ProducerReportsPage;
