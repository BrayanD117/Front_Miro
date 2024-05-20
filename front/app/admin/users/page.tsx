"use client";

import { useEffect, useState } from "react";
import { Container, Table, Button, Modal, Group, TextInput, Pagination, Center, MultiSelect } from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { IconEdit } from "@tabler/icons-react";

interface User {
  _id: string;
  identification: number;
  full_name: string;
  position: string;
  email: string;
  roles: string[];
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalOpened, setModalOpened] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);

  const fetchUsers = async (page: number, search: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/users/allPagination`, {
        params: { page, limit: 10, search }
      });
      if (response.data) {
        setUsers(response.data.users || []);
        setTotalPages(response.data.pages || 1);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchUsers(page, search);
  }, [page]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers(page, search);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setRoles(user.roles);
    setModalOpened(true);
  };

  const handleSave = async () => {
    if (selectedUser) {
      try {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/users/updateRole`, {
          id: selectedUser._id,
          roles,
        });
        showNotification({
          title: "Actualizado",
          message: "Roles del usuario actualizados exitosamente",
          color: "teal",
        });
        setModalOpened(false);
        setSelectedUser(null);
        setRoles([]);
        fetchUsers(page, search);
      } catch (error) {
        console.error("Error updating roles:", error);
        showNotification({
          title: "Error",
          message: "Hubo un error al actualizar los roles del usuario",
          color: "red",
        });
      }
    }
  };

  const rows = users.map((user) => (
    <Table.Tr key={user._id}>
      <Table.Td>{user.identification}</Table.Td>
      <Table.Td>{user.full_name}</Table.Td>
      <Table.Td>{user.position}</Table.Td>
      <Table.Td>{user.email}</Table.Td>
      <Table.Td>{user.roles.join(', ')}</Table.Td>
      <Table.Td>
        <Button variant="outline" onClick={() => handleEdit(user)}>
          <IconEdit size={16} />
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl">
      <TextInput
        placeholder="Buscar usuarios por nombre"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <Table striped withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>ID</Table.Th>
            <Table.Th>Nombre Completo</Table.Th>
            <Table.Th>Posición</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Roles</Table.Th>
            <Table.Th>Acciones</Table.Th>
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
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title="Editar Roles del Usuario"
      >
        <MultiSelect
          label="Roles"
          placeholder="Selecciona roles"
          data={["Usuario", "Admin", "Responsable", "Productor"]}
          value={roles}
          onChange={setRoles}
        />
        <Group mt="md">
          <Button onClick={handleSave}>Guardar</Button>
          <Button variant="outline" onClick={() => setModalOpened(false)}>Cancelar</Button>
        </Group>
      </Modal>
    </Container>
  );
};

export default AdminUsersPage;
