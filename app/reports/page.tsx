"use client"
import { Button, Center, Container, Group, Pagination, Table, TextInput, Title } from "@mantine/core";
import { IconArrowRight, IconCirclePlus } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

  const [reports, setReports] = 


  const rows = reports.map((report) => (
  ));

  return (
    <Container size="xl">
      <Title mb={'xl'}>Configuración Informes de Productores</Title>
      <Group mb='md'>
        <Button
          onClick={() => {
            setSelectedReport(null);
            setOpened(true);
          }}
          leftSection={<IconCirclePlus/>}
        >
          Crear Nuevo Informe
        </Button>
        <Button
          ml={"auto"}
          onClick={() => router.push("reports/uploaded")}
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
              <Center inline>
                Nombre
              </Center>
            </Table.Th>
            <Table.Th>
              <Center inline>
                Descripción
              </Center>
            </Table.Th>
            <Table.Th>
              <Center inline>
                Creado Por
              </Center>
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
    </Container>
    );
}

export default ProducerReportPage;