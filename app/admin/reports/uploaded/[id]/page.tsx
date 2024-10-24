"use client";

import DateConfig, { dateToGMT } from "@/app/components/DateConfig";
import { DriveFileFrame } from "@/app/components/DriveFileFrame";
import { Accordion, Badge, Button, Center, Collapse, Container, Group, Modal, Paper, rem, Select, Table, Text, Title, Tooltip } from "@mantine/core";
import { IconArrowLeft, IconCancel, IconCheckupList, IconChevronsLeft, IconHistory } from "@tabler/icons-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Report {
  _id: string;
  name: string;
  description: string;
  report_example_id: string;
  report_example_download: string;
  requires_attachment: boolean;
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

interface AttachmentFile extends File {
  description?: string;
}

interface DriveFile {
  id: string;
  name: string;
  download_link: string;
  description?: string;
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

const StatusColor: Record<string, string> = {
  Pendiente: "orange",
  "En Borrador": "grape",
  "En Revisión": "cyan",
  Aprobado: "lime",
  Rechazado: "red",
};

const UploadedReportsPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const { id } = useParams<{ id: string }>();
  const [publishedReport, setPublishedReport] = useState<PublishedReport>();
  const [frameFile, setFrameFile] = useState<DriveFile | null>();
  const [collapseOpened, setCollapseOpened] = useState(false);

  const fetchReport = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/pReports/admin`,{
          params: {
            reportId: id,
            email: session?.user?.email,
          }
        }
      );
      setPublishedReport(response.data.report);
    } catch (error) {
      console.error("Error fetching report:", error);
    }
  }

  useEffect(() => {
    fetchReport();
  }, []);

  console.log(publishedReport);

  const items = publishedReport?.filled_reports?.map((filledReport) => {
    return (
      <Accordion.Item 
      key={filledReport._id} value={filledReport._id}
      >
        <Accordion.Control>
          <Group>
            <IconCheckupList />
            <Badge
              w={rem(110)}
              color={
                StatusColor[filledReport?.status ?? ""] ?? "orange"
              }
              variant={"light"}
            >
              {filledReport?.status}
            </Badge>
            <Text>{filledReport.dimension.name}</Text>
            <Text ml={'auto'} mr={'md'} size="sm" fw={700}>
              {dateToGMT(filledReport.loaded_date)}
            </Text>
          </Group>
        </Accordion.Control>
        <Accordion.Panel>
          <Group grow mb={'sm'}>
            <Center>
              <Text fw={700} size="md">
                Enviado por: <Text tt='capitalize'>
                {(filledReport.send_by.full_name).toLowerCase()}
                </Text>
              </Text>
            </Center>
            <Center>
              <Text fw={700}>
                Fecha Envío: <Text>
                  {dateToGMT(filledReport.loaded_date, 'MMMM D, YYYY HH:mm')}
                </Text>
              </Text>
            </Center>
            <Center>
              <Text fw={700}>
                Acciones:
                <Group>
                  <Button
                    variant="light"
                    size="sm"
                    onClick={() => {setCollapseOpened(true)}}
                    leftSection={<IconCheckupList size={18} />}
                  >
                    Evaluar
                  </Button>
                  {filledReport.attachments.map((attachment) => (
                    <Button
                      key={attachment.id}
                      variant="light"
                      size="sm"
                      onClick={() => setFrameFile(attachment)}
                      color="gray"
                      leftSection={<IconHistory size={18} />}
                    >
                      Historial
                    </Button>
                  ))}
                </Group>
              </Text>
            </Center>
          </Group>
          <Collapse in={collapseOpened}>
            <Paper shadow="lg" p={'md'}>
              <Group>
                <Select data={["Aprobado", "Rechazado", "En Revisón"]}/>
                <Text>
                  {filledReport.observations}
                </Text>
              </Group>
            </Paper>
          </Collapse>
          <Table withColumnBorders withTableBorder striped>
            <Table.Thead>
              <Table.Th maw={rem(50)}></Table.Th>
              <Table.Th maw={rem(10)}><Center>#</Center></Table.Th>
              <Table.Th>Archivo</Table.Th>
              {publishedReport?.report.requires_attachment && (
                <Table.Th miw={rem(250)}>Descripción</Table.Th>
              )}
            </Table.Thead>
            <Table.Tbody>
              <Table.Tr>
                <Table.Td fw={700} maw={rem(50)}>
                  Reporte
                </Table.Td>
                <Table.Td/>
                <Table.Td>
                  <Button
                    onClick={() => setFrameFile(filledReport.report_file)}
                    variant="light"
                    size="compact-xs"
                    color="green"
                    autoContrast
                  >
                    {filledReport.report_file.name}
                  </Button>
                </Table.Td>
                {publishedReport?.report.requires_attachment && (
                  <Table.Td>
                    {filledReport.report_file.description}
                  </Table.Td>
                )}
              </Table.Tr>
              {filledReport.attachments.map((attachment, index) => (
                <Table.Tr key={attachment.id}>
                  <Table.Td fw={700} rowSpan={100}>
                    Anexos
                  </Table.Td>
                  <Table.Td ta={'center'}>
                    {index + 1}
                  </Table.Td>
                  <Table.Td>
                    <Button
                      onClick={() => setFrameFile(attachment)}
                      variant="light"
                      size="compact-xs"
                    >
                      {attachment.name}
                    </Button>
                  </Table.Td>
                  {publishedReport?.report.requires_attachment && (
                    <Table.Td>
                      {attachment.description}
                    </Table.Td>
                  )}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Accordion.Panel>
      </Accordion.Item>
    )
  })
  const missingItems = publishedReport?.dimensions?.map((dimension) => {
    if (
      !publishedReport?.filled_reports?.some(
        (filledReport: FilledReport) =>
          filledReport.dimension._id === dimension._id
      )
    ) {
      return (
        <Tooltip
          key={dimension._id}
          label="Esta dimensión no ha enviado ningún reporte"
          transitionProps={{ transition: "fade-up", duration: 300 }}
        >
          <Accordion.Item key={dimension._id} value={dimension._id}>
            <Accordion.Control disabled>
              <Group>
                <IconCancel color="red" />
                <Badge
                  w={rem(110)}
                  color={"orange"}
                  variant={"light"}
                >
                  Sin envío
                </Badge>
                {dimension.name}
              </Group>
            </Accordion.Control>
          </Accordion.Item>
        </Tooltip>
      );
    }
  });

  return (
    <Container size={"xl"}>
      <DateConfig/>
      <Title ta="center">{`Envíos para: ${publishedReport?.report.name}`}</Title>
      <Group mb="md">
        <Button
          variant="outline"
          leftSection={<IconArrowLeft />}
          onClick={() => router.back()}
        >
          Ir atrás
        </Button>
      </Group>
      <Accordion>
        {items}
        {missingItems}
      </Accordion>
      <Modal
        opened={Boolean(frameFile)}
        onClose={() => setFrameFile(null)}
        size="xl"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        withCloseButton={false}
      >
        <>
          <Button
            mx={"sm"}
            variant="light"
            size="compact-md"
            onClick={() => setFrameFile(null)}
            mb={"sm"}
          >
            <IconChevronsLeft />
            <Text size="sm" fw={600}>
              Ir atrás
            </Text>
          </Button>
          <Text component="span" fw={700}>
            {frameFile?.name}
          </Text>
          <DriveFileFrame fileId={frameFile?.id || ""} fileName={frameFile?.name || ""} />
        </>
      </Modal>
    </Container>
  );
}

export default UploadedReportsPage;