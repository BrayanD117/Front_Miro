"use client";

import { useEffect, useState } from "react";
import { Container, Table, Button, TextInput, Group, Title, Divider, Box, Checkbox, ScrollArea, Pagination, Center } from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { useSession } from "next-auth/react";
import { IconTrash } from "@tabler/icons-react";

interface Dimension {
  _id: string;
  name: string;
  responsible: string;
  producers: string[];
}

interface Dependency {
  dep_code: string;
  name: string;
}

const ResponsibleDimensionPage = () => {
  const [dimension, setDimension] = useState<Dimension | null>(null);
  const [allDependencies, setAllDependencies] = useState<Dependency[]>([]);
  const [producers, setProducers] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchDimension = async () => {
      if (session?.user?.email) {
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dimensions/responsible`, {
            params: { email: session.user.email },
          });
          setDimension(response.data[0]);
          setProducers(response.data[0].producers);
        } catch (error) {
          console.error("Error fetching dimension:", error);
        }
      }
    };

    fetchDimension();
  }, [session]);

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dependencies/all`, {
          params: { page, search },
        });
        setAllDependencies(response.data.dependencies);
        setTotalPages(response.data.pages);
      } catch (error) {
        console.error("Error fetching dependencies:", error);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchDependencies();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [page, search]);

  const handleSave = async () => {
    if (dimension) {
      try {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/dimensions/${dimension._id}`, {
          ...dimension,
          producers,
        });
        showNotification({
          title: "Actualizado",
          message: "Dimensión actualizada exitosamente",
          color: "teal",
        });
      } catch (error) {
        console.error("Error updating dimension:", error);
        showNotification({
          title: "Error",
          message: "Hubo un error al actualizar la dimensión",
          color: "red",
        });
      }
    }
  };

  const handleProducerToggle = (dep_code: string) => {
    if (producers.includes(dep_code)) {
      setProducers(producers.filter((producer) => producer !== dep_code));
    } else {
      setProducers([...producers, dep_code]);
    }
  };

  const selectedProducerRows = producers.map((dep_code) => {
    const dependency = allDependencies.find((dep) => dep.dep_code === dep_code);
    return (
      <Table.Tr key={dep_code}>
        <Table.Td>{dependency?.name || dep_code}</Table.Td>
        <Table.Td>
          <Button color="red" variant="outline" onClick={() => handleProducerToggle(dep_code)}>
            <IconTrash size={16} />
          </Button>
        </Table.Td>
      </Table.Tr>
    );
  });

  const allDependenciesRows = allDependencies.map((dep) => (
    <Table.Tr key={dep.dep_code}>
      <Table.Td>
        <Checkbox
          checked={producers.includes(dep.dep_code)}
          onChange={() => handleProducerToggle(dep.dep_code)}
        />
      </Table.Td>
      <Table.Td>{dep.name}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl">
      <Title order={2} mb="md">Gestionar Dimensión</Title>
      <Box mb="lg">
        <TextInput
          label="Nombre de la Dimensión"
          value={dimension?.name || ""}
          readOnly
          mb="md"
        />
        <TextInput
          label="Responsable"
          value={dimension?.responsible || ""}
          readOnly
          mb="md"
        />
      </Box>
      <Divider my="sm" />
      <Title order={4} mb="md">Agregar Productores</Title>
      <TextInput
        placeholder="Buscar dependencias"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <ScrollArea style={{ height: 300 }}>
        <Table striped withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Seleccionar</Table.Th>
              <Table.Th>Nombre del Productor</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{allDependenciesRows}</Table.Tbody>
        </Table>
      </ScrollArea>
      <Center mt="md">
        <Pagination value={page} onChange={setPage} total={totalPages} />
      </Center>
      <Divider my="sm" />
      <Title order={4} mb="md">Productores Seleccionados</Title>
      <Table striped withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nombre del Productor</Table.Th>
            <Table.Th>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{selectedProducerRows}</Table.Tbody>
      </Table>
      <Group mt="md">
        <Button onClick={handleSave}>Guardar</Button>
      </Group>
    </Container>
  );
};

export default ResponsibleDimensionPage;
