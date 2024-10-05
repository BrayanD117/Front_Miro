"use client";

import { useEffect, useState } from "react";
import { Container, Table, Button, Modal, TextInput, Group, Pagination, Center, Select, Text, List } from "@mantine/core";
import { IconSettings, IconEdit, IconTrash, IconEye, IconBulb, IconCirclePlus, IconDeviceFloppy, IconCancel, IconArrowBigUpFilled, IconArrowBigDownFilled, IconArrowsTransferDown } from "@tabler/icons-react";
import { useRouter } from 'next/navigation';
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { useSort } from "../../hooks/useSort";

interface Dimension {
  _id: string;
  name: string;
  responsible: string;
  producers: string[];
}

interface User {
  _id: string;
  full_name: string;
  email: string;
  roles: string[];
}

interface Dependency {
  dep_code: string;
  name: string;
}

const AdminDimensionsPage = () => {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [opened, setOpened] = useState(false);
  const [producersModalOpened, setProducersModalOpened] = useState(false);
  const [selectedDimension, setSelectedDimension] = useState<Dimension | null>(null);
  const [selectedProducers, setSelectedProducers] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [responsible, setResponsible] = useState<string | null>(null);
  const [responsiblesOptions, setResponsiblesOptions] = useState<{ value: string, label: string }[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { sortedItems: sortedDimensions, handleSort, sortConfig } = useSort<Dimension>(dimensions, { key: null, direction: "asc" });

  const fetchDimensions = async (page: number, search: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dimensions/all`, {
        params: { page, limit: 10, search },
      });
      if (response.data) {
        const dimensions = response.data.dimensions || [];
        const producerCodes = dimensions.flatMap((dimension: { producers: any; }) => dimension.producers);
        const dependenciesResponse = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/dependencies/names`, { codes: producerCodes });
        const dependencies = dependenciesResponse.data;
        setDependencies(dependencies);
        setDimensions(dimensions);
        setTotalPages(response.data.pages || 1);
        console.log("Dimensions:", dimensions);
        console.log("Dependencies:", dependencies);
      }
    } catch (error) {
      console.error("Error fetching dimensions:", error);
      setDimensions([]);
    }
  };

  const fetchResponsibles = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/responsibles`);
      if (response.data) {
        setResponsiblesOptions(
          response.data.map((user: User) => ({
            value: user.email,
            label: `${user.full_name} (${user.email})`,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching responsibles:", error);
    }
  };

  useEffect(() => {
    fetchDimensions(page, search);
    fetchResponsibles();
  }, [page]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDimensions(page, search);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleCreateOrEdit = async () => {
    if (!name || !responsible) {
      showNotification({
        title: "Error",
        message: "El nombre y el responsable son requeridos",
        color: "red",
      });
      return;
    }

    try {
      const dimensionData = {
        name,
        responsible,
      };

      if (selectedDimension) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/dimensions/${selectedDimension._id}`, dimensionData);
        showNotification({
          title: "Actualizado",
          message: "Dimensión actualizada exitosamente",
          color: "teal",
        });
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/dimensions/create`, dimensionData);
        showNotification({
          title: "Creado",
          message: "Dimensión creada exitosamente",
          color: "teal",
        });
      }

      handleModalClose();
      fetchDimensions(page, search);
    } catch (error) {
      console.error("Error creando o actualizando dimensión:", error);

      if (axios.isAxiosError(error) && error.response && error.response.status === 400) {
        showNotification({
          title: "Error",
          message: "El nombre de la dimensión ya existe",
          color: "red",
        });
      } else {
        showNotification({
          title: "Error",
          message: "Hubo un error al crear o actualizar la dimensión",
          color: "red",
        });
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/dimensions/${id}`);
      showNotification({
        title: "Eliminado",
        message: "Dimensión eliminada exitosamente",
        color: "teal",
      });
      fetchDimensions(page, search);
    } catch (error) {
      console.error("Error eliminando dimensión:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al eliminar la dimensión",
        color: "red",
      });
    }
  };

  const handleShowProducers = (dimension: Dimension) => {
    const producerNames = dimension.producers.map(code => dependencies.find(dep => dep.dep_code === code)?.name || code);
    setSelectedProducers(producerNames);
    setProducersModalOpened(true);
  };

  const handleModalClose = () => {
    setOpened(false);
    setName("");
    setResponsible(null);
    setSelectedDimension(null);
    setSelectedProducers([]);
  };

  const handleConfigureProducers = (dimension: Dimension) => {
    router.push(`/admin/dimensions/${dimension._id}`);
  };
  
  const rows = sortedDimensions.map((dimension: Dimension) => (
    <Table.Tr key={dimension._id}>
      <Table.Td>{dimension.name}</Table.Td>
      <Table.Td>{dimension.responsible}</Table.Td>
      <Table.Td>
        {dimension.producers.slice(0, 1).map(code => dependencies.find(dep => dep.dep_code === code)?.name || code).join(", ")}
        {dimension.producers.length > 2 && (
          <>
            , ...
            <Button variant="subtle" ml={'5px'} onClick={() => handleShowProducers(dimension)}>
              <IconEye size={16} />
            </Button>
          </>
        )}
      </Table.Td>
      <Table.Td>
        <Center>
          <Group gap={5}>
            <Button variant="outline" onClick={() => handleConfigureProducers(dimension)}>
            <IconSettings size={16} />
            </Button>
            <Button color="red" variant="outline" onClick={() => handleDelete(dimension._id)}>
              <IconTrash size={16} />
            </Button>
          </Group>
        </Center>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl">
      <TextInput
        placeholder="Buscar en todas las dimensiones"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <Group>
        <Button
          onClick={() => {
            setSelectedDimension(null);
            setOpened(true);
          }}
          leftSection={<IconCirclePlus/>}
        >
          Crear Nueva Dimensión
        </Button>
      </Group>
      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
          <Table.Th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
              <Center inline>
                Nombre
                {sortConfig.key === "name" ? (
                  sortConfig.direction === "asc" ? (
                    <IconArrowBigUpFilled size={16} style={{ marginLeft: "5px" }} />
                  ) : (
                    <IconArrowBigDownFilled size={16} style={{ marginLeft: "5px" }} />
                  )
                ) : (
                  <IconArrowsTransferDown size={16} style={{ marginLeft: "5px" }} />
                )}
              </Center>
            </Table.Th>
            <Table.Th onClick={() => handleSort("responsible")} style={{ cursor: "pointer" }}>
              <Center inline>
                Responsable
                {sortConfig.key === "responsible" ? (
                  sortConfig.direction === "asc" ? (
                    <IconArrowBigUpFilled size={16} style={{ marginLeft: "5px" }} />
                  ) : (
                    <IconArrowBigDownFilled size={16} style={{ marginLeft: "5px" }} />
                  )
                ) : (
                  <IconArrowsTransferDown size={16} style={{ marginLeft: "5px" }} />
                )}
              </Center>
            </Table.Th>
            <Table.Th>Productores</Table.Th>
            <Table.Th><Center>Acciones</Center></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
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
        onClose={handleModalClose}
        title={selectedDimension ? "Editar Dimensión" : "Crear Nueva Dimensión"}
      >
        <TextInput
          label="Nombre"
          placeholder="Nombre de la dimensión"
          value={name}
          onChange={(event) => setName(event.currentTarget.value)}
        />
        <Select
          label="Responsable"
          placeholder="Selecciona un responsable"
          data={responsiblesOptions}
          value={responsible}
          onChange={(value) => setResponsible(value)}
          searchable
          clearable
        />
        <Group mt="md" grow>
          <Button 
            onClick={handleCreateOrEdit}
            leftSection={<IconDeviceFloppy/>}
            rightSection={<span/>}
            justify="space-between"
          >
            {selectedDimension ? "Actualizar" : "Crear"}
          </Button>
          <Button
            onClick={handleModalClose}
            variant="light"
            color="red"
            rightSection={<IconCancel/>}
            leftSection={<span/>}
            justify="space-between"
          >
            Cancelar
          </Button>
        </Group>
      </Modal>
      <Modal
        opened={producersModalOpened}
        onClose={() => setProducersModalOpened(false)}
        title="Productores"
      >
        <List withPadding>
          {selectedProducers.map((producer, index) => (
            <List.Item key={index}>{producer}</List.Item>
          ))}
        </List>
          <Text c="dimmed" size="xs" ta={"center"} mt="md" >
            <IconBulb color="#797979" size={20}></IconBulb>
            <br/>
            Recuerda que los productores se asignan en la gestión de la dimensión
          </Text>
      </Modal>
    </Container>
  );
};

export default AdminDimensionsPage;
