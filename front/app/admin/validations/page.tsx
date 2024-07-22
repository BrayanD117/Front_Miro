"use client";

import { useEffect, useState } from "react";
import { Container, Table, Button, Pagination, Center, TextInput, Group } from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { IconEdit, IconTrash, IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useDisclosure } from '@mantine/hooks';

interface Validation {
  _id: string;
  name: string;
  columns: {
    name: string;
    is_validator: boolean;
    type: string;
    values: any[];
  }[];
}

const AdminValidationsPage = () => {
  const [validations, setValidations] = useState<Validation[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const fetchValidations = async (page: number, search: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/validators/pagination`, {
        params: { page, limit: 10, search },
      });
      if (response.data) {
        setValidations(response.data.validators || []);
        setTotalPages(response.data.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching validations:", error);
      setValidations([]);
    }
  };

  useEffect(() => {
    fetchValidations(page, search);
  }, [page]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchValidations(page, search);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/validators/delete`, { data: { id } });
      showNotification({
        title: "Eliminado",
        message: "Validación eliminada exitosamente",
        color: "teal",
      });
      fetchValidations(page, search);
    } catch (error) {
      console.error("Error eliminando validación:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al eliminar la validación",
        color: "red",
      });
    }
  };

  const rows = validations.map((validation) => (
    <Table.Tr key={validation._id}>
      <Table.Td>{validation.name}</Table.Td>
      <Table.Td>{validation.columns.map(col => col.name).join(', ')}</Table.Td>
      <Table.Td>
        <Center>
          <Group gap={5}>
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/validations/update/${validation._id}`)}
            >
              <IconEdit size={16} />
            </Button>
            <Button color="red" variant="outline" onClick={() => handleDelete(validation._id)}>
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
        placeholder="Buscar validaciones"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <Group mb="md">
        <Button onClick={() => router.push('/admin/validations/create')} leftSection={<IconPlus size={20} />}>
          Crear Nueva Validación
        </Button>
      </Group>
      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Columnas</Table.Th>
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
    </Container>
  );
};

export default AdminValidationsPage;
