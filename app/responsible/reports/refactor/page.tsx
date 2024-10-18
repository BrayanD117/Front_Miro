"use client";

import { use, useEffect, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { Button, Center, Container, Group, rem, Table, TextInput, Title, Tooltip } from "@mantine/core";
import { dateToGMT } from "@/app/components/DateConfig";
import { IconHistory, IconReportAnalytics } from "@tabler/icons-react";

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
}

const ResponsibleReportsPage = () => {
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [publishedReports, setPublishedReports] = useState<PublishedReport[]>([]);

  const fetchReports = async (page: Number, search: String) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/pReports/responsible`,
        {
          params: {
            page: page,
            search: search,
            email: session?.user?.email,
          },
        }
      );
      if (response.data) {
        setPublishedReports(response.data.publishedReports);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    if (session?.user?.email) {
      const delayDebounceFn = setTimeout(() => {
        fetchReports(page, search);
      }, 500);
      return () => clearTimeout(delayDebounceFn);
    }
  }, [search, session?.user?.email, page]);

  const rows = publishedReports.map((pReport) => (
    <Table.Tr key={pReport._id}>
      <Table.Td>{pReport.period.name}</Table.Td>
      <Table.Td>{dateToGMT(pReport.period.responsible_start_date)}</Table.Td>
      <Table.Td>{dateToGMT(pReport.period.responsible_end_date)}</Table.Td>
      <Table.Td>
        <a href={pReport.report.report_example_download} target="_blank">
          {pReport.report.name}
        </a>
      </Table.Td>
      <Table.Td>
        <Center>
            {pReport.filled_reports[0]?.status ?? "Pendiente"}
        </Center>
      </Table.Td>
      <Table.Td>
        <Center>{pReport.filled_reports[0] ? 
          dateToGMT(pReport.filled_reports[0].status_date) : ""}
        </Center>
      </Table.Td>
      <Table.Td>
        <Center>
          <Group>
            <Tooltip
              label="Ver reporte"
              transitionProps={{ transition: "fade-up", duration: 300 }}
            >
              <Button
                onClick={() => {

                }}
                variant="outline"
                color="blue"
              >
                <IconReportAnalytics size={18} />
              </Button>
            </Tooltip>
            <Tooltip
              label="Ver historial de envíos"
              transitionProps={{ transition: "fade-up", duration: 300 }}
            >
              <Button
                onClick={() => {

                }}
                variant="outline"
                color="gray"
              >
                <IconHistory size={18} />
              </Button>
            </Tooltip>
          </Group>
        </Center>
      </Table.Td>
    </Table.Tr>
  ))

  return (
    <Container size="xl">
      <Title ta="center" mb={"md"}>
        Gestión de Reportes
      </Title>
      <TextInput
        placeholder="Buscar en los reportes publicados"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Periodo</Table.Th>
            <Table.Th>Fecha Inicio</Table.Th>
            <Table.Th>Fecha Límite</Table.Th>
            <Table.Th>Reporte</Table.Th>
            <Table.Th w={rem(20)}>
              <Center>Estado</Center>
            </Table.Th>
            <Table.Th>
              <Center>Fecha de Estado</Center>
            </Table.Th>
            <Table.Td fw={700}>
              <Center>Acciones</Center>
            </Table.Td>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.length > 0 ? rows :
            <Table.Tr>
              <Table.Td colSpan={10}>No se encontraron reportes pendientes</Table.Td>
            </Table.Tr>
          }
        </Table.Tbody>
      </Table>

    </Container>
  )
}

export default ResponsibleReportsPage;