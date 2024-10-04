"use client";

import { useEffect, useState } from "react";
import { Container, Table, Button, TextInput, Title, Divider, Box, Checkbox, ScrollArea, Pagination, Center, Tooltip, Grid } from "@mantine/core";
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
  const [producerNames, setProducerNames] = useState<{ [key: string]: string }>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { data: session } = useSession();

  useEffect(() => {
    const fetchDimension = async () => {
      if (!dimension && session?.user?.email) {
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dimensions/responsible`, {
            params: { email: session.user.email },
          });
          const dimensionData = response.data[0];
          if (dimensionData) {
            setDimension(dimensionData);
            setProducers(dimensionData.producers);
  
            console.log('Fetching producer names for:', dimensionData.producers);
  
            const producerResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/dependencies/names`, {
              codes: dimensionData.producers,
            });
  
            console.log('Producer names received:', producerResponse.data);
  
            const newProducerNames = producerResponse.data.reduce((acc: any, dep: any) => {
              acc[dep.dep_code] = dep.name;
              return acc;
            }, {});
            setProducerNames(newProducerNames);
          } else {
            console.error("No se encontró una dimensión para el responsable.");
          }
        } catch (error) {
          console.error("Error al obtener la dimensión:", error);
        }
      }
    };
  
    fetchDimension();
  }, [session, dimension]);  

  useEffect(() => {
    const fetchDependencies = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dependencies/all`, {
          params: { page, search },
        });
        setAllDependencies(response.data.dependencies);
        setTotalPages(response.data.pages);
      } catch (error) {
        console.error("Error al obtener las dependencias:", error);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchDependencies();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [page, search]);

  const handleSave = async (updatedProducers?: string[]) => {
    if (dimension) {
      try {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/dimensions/${dimension._id}`, {
          ...dimension,
          producers: updatedProducers || producers,
        });
        showNotification({
          title: "Actualizado",
          message: "Dimensión actualizada exitosamente",
          color: "teal",
        });
      } catch (error) {
        console.error("Error al actualizar la dimensión:", error);
        showNotification({
          title: "Error",
          message: "Hubo un error al actualizar la dimensión",
          color: "red",
        });
      }
    }
  };

  const handleProducerToggle = async (dep_code: string) => {
    let updatedProducers;
    if (producers.includes(dep_code)) {
      updatedProducers = producers.filter((producer) => producer !== dep_code);
    } else {
      updatedProducers = [...producers, dep_code];
  
      if (!producerNames[dep_code]) {
        try {
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/dependencies/names`, {
            codes: [dep_code],
          });
          const newProducerNames = response.data.reduce((acc: any, dep: any) => {
            acc[dep.dep_code] = dep.name;
            return acc;
          }, {});
          setProducerNames((prevNames) => ({ ...prevNames, ...newProducerNames }));
        } catch (error) {
          console.error("Error al obtener el nombre del productor:", error);
        }
      }
    }
    setProducers(updatedProducers);
  
    await handleSave(updatedProducers);
  };  

  const selectedProducerRows = producers.map((dep_code) => (
    <Table.Tr key={dep_code}>
      <Table.Td>{producerNames[dep_code] || dep_code}</Table.Td>
      <Table.Td>
        <Button color="red" variant="outline" onClick={() => handleProducerToggle(dep_code)}>
          <IconTrash size={16} />
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

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
      <Title order={2} mb="md">
        Gestionar Dimensión
      </Title>
      <Box mb="lg">
        <TextInput
          label="Nombre de la Dimensión"
          value={dimension?.name || ""}
          readOnly
          mb="md"
        />
        <TextInput
          label="Responsable"
          value={session?.user?.name || ""}
          readOnly
          mb="md"
        />
        <TextInput
          label="Correo del Responsable"
          value={dimension?.responsible || ""}
          readOnly
          mb="md"
        />
      </Box>
      <Divider my="sm" />
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Title order={4} mb="md">
            Agregar Productores
          </Title>
          <TextInput
            placeholder="Buscar dependencias"
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            mb="md"
          />
          <Tooltip 
            label="Desplázate para ver más dependencias"
            transitionProps={{ transition: "slide-up", duration: 300 }}
            withArrow
          >
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
          </Tooltip>
          <Center mt="md">
            <Pagination value={page} onChange={setPage} total={totalPages} />
          </Center>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Title order={4} mb="md">
            Productores Seleccionados
          </Title>
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Nombre del Productor</Table.Th>
                <Table.Th>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{selectedProducerRows}</Table.Tbody>
          </Table>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default ResponsibleDimensionPage;
