"use client"
import DateConfig, { dateToGMT } from "@/app/components/DateConfig";
import { Button, Center, Checkbox, Container, FileInput, Group, Modal, MultiSelect, Pagination, rem, Select, Switch, Table, Text, Textarea, TextInput, Title, Tooltip } from "@mantine/core";
import { DateInput, DatePickerInput } from "@mantine/dates";
import { showNotification } from "@mantine/notifications";
import { IconArrowRight, IconCancel, IconCheck, IconCirclePlus, IconDeviceFloppy, IconEdit, IconEye, IconSend, IconTrash, IconUser, IconX } from "@tabler/icons-react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

interface Report {
  _id: string;
  name: string;
  description: string;
  report_example: DriveFile;
  requires_attachment: boolean;
  file_name: string;
  created_by: {
    email: string;
    full_name: string;
  };
}

interface Period {
  _id: string;
  name: string;
  producer_end_date: Date;
}

interface DriveFile {
  id: string;
  name: string;
  view_link: string;
}


const StatusColor: Record<string, string> = {
  Pendiente: "orange",
  "En Borrador": "grape",
  "En Revisión": "cyan",
  Aprobado: "lime",
  Rechazado: "red",
};

const ProducerReportPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [customDeadline, setCustomDeadline] = useState(false);

  const [opened, setOpened] = useState(false);

  const fetchReports = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/producerReports/`, {
        params: {
          email: session?.user?.email,
          page: page,
          search: search,
        },
      });
      setReports(response.data.reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al obtener los informes",
        color: "red",
      });
    }
  }

  const fetchPeriods = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/periods/active`);
      console.log(response.data);
      setPeriods(response.data);
    } catch (error) {
      console.error("Error fetching periods:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al obtener los periodos",
        color: "red",
      });
    }
  }

  const handlePublish = async (reportId: string) => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/pProducerReports/publish`, {
        reportId,
        deadline: customDeadline ? deadline : selectedPeriod ?
          new Date(periods.find(period => period._id === selectedPeriod)?.producer_end_date || '') : null,
        period: selectedPeriod,
        email: session?.user?.email
      });
      showNotification({
        title: "Éxito",
        message: "Informe publicado correctamente",
        color: "green",
      });
      setOpened(false);
      setSelectedReport(null);
      setSelectedPeriod(null);
      setDeadline(null);
      setCustomDeadline(false);
    } catch (error) {
      console.error("Error publishing report:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al publicar el informe",
        color: "red",
      });
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchReports();
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  useEffect(() => {
    fetchPeriods();
  }, [selectedReport]);

  const rows = reports?.map((report: Report) => (
    <Table.Tr key={report._id}>
      <Table.Td>
        {report.name}
      </Table.Td>
      <Table.Td maw={rem(400)}>
        <Text size="sm" lineClamp={1}>
          {report.description}
        </Text>
      </Table.Td>
      <Table.Td>
        {report.created_by.full_name}
      </Table.Td>
      <Table.Td>
        <Center>
          <Group gap={'xs'}>
            <Tooltip
              label="Ver formato informe"
              position="top"
              withArrow
              transitionProps={{ transition: 'fade-up', duration: 300 }}
            >
              <Button
                onClick={() => {
                  if(typeof window !== 'undefined') 
                    window.open(report.report_example.view_link, '_blank');
                }}
                variant="outline"
              >
                <IconEye size={16} />
              </Button>
            </Tooltip>
            <Tooltip
              label="Editar informe"
              position="top"
              withArrow
              transitionProps={{ transition: 'fade-up', duration: 300 }}
            >
              <Button
                onClick={ () => {
                }}
                variant="outline"
              >
                <IconEdit size={16} />
              </Button>
            </Tooltip>
            <Tooltip
              label="Borrar informe"
              position="top"
              withArrow
              transitionProps={{ transition: 'fade-up', duration: 300 }}
            >
              <Button
                color="red"
                variant="outline"
              >
                <IconTrash size={16} />
              </Button>
            </Tooltip>
          </Group>
        </Center>
      </Table.Td>
      <Table.Td>
        <Center>
          <Tooltip
            label="Asignar informe a periodo"
            position="top"
            withArrow
            transitionProps={{ transition: 'fade-up', duration: 300 }}
          >
            <Button
              onClick={() => {
                setSelectedReport(report);
                setOpened(true);
              }}
              variant="outline"
            >
              <IconUser size={16} />
            </Button>
          </Tooltip>
        </Center>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl">
      <DateConfig />
      <Title mb={'xl'}>Configuración Informes de Productores</Title>
      <Group mb='md'>
        <Button
          onClick={() => {
            router.push("producers/create");
          }}
          leftSection={<IconCirclePlus/>}
        >
          Crear Nuevo Informe
        </Button>
        <Button
          ml={"auto"}
          onClick={() => router.push("/reports")}
          variant="outline"
          rightSection={<IconArrowRight size={16} />}
        >
          Ir a Informes Publicados
        </Button>
      </Group>
      <TextInput
        placeholder="Buscar en todos los reportes"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              Nombre
            </Table.Th>
            <Table.Th>
              Descripción
            </Table.Th>
            <Table.Th>
              Creado Por
            </Table.Th>
            <Table.Th>
              <Center>Acciones</Center>
            </Table.Th>
            <Table.Th>
              <Center>Asignar</Center>
            </Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows}
        </Table.Tbody>
      </Table>
      <Center>
        <Pagination
          mt={15}
          value={page}
          onChange={setPage}
          total={totalPages}
          siblings={1}
          boundaries={3}
        />
      </Center>
      <Modal
        opened={opened}
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        onClose={() => {
          setOpened(false)
          setSelectedReport(null);
          setSelectedPeriod(null);
          setDeadline(null);
          setCustomDeadline(false);
        }}
        title={<Text fw={700}>Asignar Informe a Periodo</Text>}
        size="md"
      >
        <Select
          data={periods?.map((period) => ({ value: period._id, label: period.name }))}
          placeholder="Seleccionar Periodo"
          label="Periodo"
          value={selectedPeriod}
          onChange={(value) => {
            setSelectedPeriod(value)
            const selectedPeriod = periods.find((period) => period._id === value);
            setDeadline(selectedPeriod ? new Date(selectedPeriod.producer_end_date) : null);
          }}
        />
        {
          selectedPeriod &&
          <>
            <Text size="sm" mt={'xs'} c='dimmed'>Fecha Límite: {deadline ? dateToGMT(deadline) : "No disponible"}</Text>
            <Checkbox
              mt={'sm'}
              mb={'xs'}
              label="Establecer un plazo inferior al establecido en el periodo"
              checked={customDeadline}
              onChange={(event) => setCustomDeadline(event.currentTarget.checked)}
            />
          </>
        }
        {
          customDeadline &&
          <DateInput
            locale="es"
            label="Fecha Límite"
            value={deadline}
            onChange={setDeadline}
            maxDate={deadline ?? undefined}
          />
        }
        <Group mt={'md'} grow>
          <Button
            leftSection={<IconCancel />}
            color="red"
            variant="outline"
            onClick={() => {
              setOpened(false)
              setSelectedReport(null);
              setSelectedPeriod(null);
              setDeadline(null);
              setCustomDeadline(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            leftSection={<IconSend />}
            variant="light"
            onClick={() => handlePublish(selectedReport?._id || '')}
          >
            Asignar
          </Button>
        </Group>
      </Modal>
    </Container>
    );
}

export default ProducerReportPage;