"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Table,
  Button,
  Modal,
  Group,
  TextInput,
  Pagination,
  Center,
  MultiSelect,
  Switch,
  Tooltip,
  Title,
  Select,
  Stack,
} from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import {
  IconEdit,
  IconRefresh,
  IconArrowBigUpFilled,
  IconArrowBigDownFilled,
  IconArrowsTransferDown,
  IconSwitch3,
  IconDeviceFloppy,
  IconCancel,
  IconUser,
} from "@tabler/icons-react";
import styles from "./AdminUsersPage.module.css";
import { useSort } from "../../hooks/useSort";
import { signIn, useSession } from "next-auth/react";

interface User {
  _id: string;
  identification: number;
  full_name: string;
  position: string;
  email: string;
  roles: string[];
  isActive: boolean;
  dep_code: string;
}

interface Dependency {
  _id: string;
  dep_code: string;
  name: string;
}

const AdminUsersPage = () => {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newDependency, setNewDependency] = useState<Dependency | undefined>();
  const [modalOpened, setModalOpened] = useState(false);
  const [migrateModalOpened, setMigrateModalOpened] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const {
    sortedItems: sortedUsers,
    handleSort,
    sortConfig,
  } = useSort<User>(users, { key: null, direction: "asc" });

  const fetchUsers = async (page: number, search: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users/allPagination`,
        {
          params: { page, limit: 10, search },
        }
      );
      if (response.data) {
        setUsers(response.data.users || []);
        setTotalPages(response.data.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
    }
  };

  const fetchDependencies = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/dependencies/all/${session?.user?.email}`
      );
      if (response.data) {
        setDependencies(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching dependencies:", error);
      setDependencies([]);
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
    setRoles(
      user.roles.filter((role) => role !== "Productor" && role !== "Usuario")
    );
    setModalOpened(true);
  };

  const handleSave = async () => {
    if (selectedUser) {
      try {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/users/updateRole`, {
          email: selectedUser.email,
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

  const handleMigration = async () => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/users/migrate`, {
        email: selectedUser?.email,
        dep_code: selectedUser?.dep_code,
        new_dep_code: newDependency?.dep_code,
      });
      showNotification({
        title: "Migrado",
        message: "Usuario migrado exitosamente",
        color: "teal",
      });
      setMigrateModalOpened(false);
      setSelectedUser(null);
      setNewDependency(undefined);
      fetchUsers(page, search);
    } catch (error) {
      console.error("Error migrating user:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al migrar el usuario",
        color: "red",
      });
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/users/updateStatus`, {
        userId,
        isActive,
      });
      showNotification({
        title: "Actualizado",
        message: "Estado del usuario actualizado exitosamente",
        color: "teal",
      });
      fetchUsers(page, search);
    } catch (error) {
      console.error("Error updating user status:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al actualizar el estado del usuario",
        color: "red",
      });
    }
  };

  const handleSyncUsers = async () => {
    setIsLoading(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/updateAll`);
      showNotification({
        title: "Sincronizado",
        message: "Usuarios sincronizados exitosamente",
        color: "teal",
      });
      fetchUsers(page, search);
    } catch (error) {
      console.error("Error syncing users:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al sincronizar los usuarios",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImpersonateUser = async (userId: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/users/impersonate?id=${userId}`
      );

      const { _id, email, full_name } = response.data || {};

      if (!_id || !email || !full_name) {
        console.log(response.data);
        throw new Error(
          "Invalid API response: missing _id, email or full_name"
        );
      }

      await signIn("impersonate", {
        id: _id,
        userEmail: email,
        userName: full_name,
        isImpersonating: true,
      });
    } catch (error) {
      console.error("Error impersonating user:", error);
      showNotification({
        title: "Error al intentar impersonar usuario",
        message: error instanceof Error ? error.message : "Error inesperado",
        color: "red",
      });
    }
  };

  const rows = sortedUsers.map((user) => (
    <Table.Tr key={user._id}>
      <Table.Td>{user.identification}</Table.Td>
      <Table.Td>{user.full_name}</Table.Td>
      <Table.Td>{user.position}</Table.Td>
      <Table.Td>{user.email}</Table.Td>
      <Table.Td>{user.roles.join(", ")}</Table.Td>
      <Table.Td>
        <Stack gap={5}>
          <Button variant="outline" onClick={() => handleEdit(user)}>
            <IconEdit size={16} />
          </Button>
          <Tooltip
            label="Migrar Usuario de Dependencia"
            position="top"
            transitionProps={{ transition: "fade-up", duration: 300 }}
          >
            <Button
              color="orange"
              variant="outline"
              onClick={() => {
                fetchDependencies();
                setMigrateModalOpened(true);
                setSelectedUser(user);
              }}
            >
              <IconSwitch3 size={16} />
            </Button>
          </Tooltip>

          {session?.user?.image ? (
            <Tooltip
              label="Impersonar usuario"
              position="top"
              transitionProps={{ transition: "fade-up", duration: 300 }}
            >
              <Button
                color="green"
                variant="outline"
                onClick={() => {
                  handleImpersonateUser(user._id);
                }}
              >
                <IconUser size={16} />
              </Button>
            </Tooltip>
          ) : null}
        </Stack>
      </Table.Td>
      <Table.Td>
        <Center>
          <Switch
            checked={user.isActive}
            onChange={(event) =>
              handleToggleActive(user._id, event.currentTarget.checked)
            }
            label={user.isActive ? "Activo" : "Inactivo"}
            color="teal"
            ml="md"
          />
        </Center>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl">
      <Group className={styles.customGroup} mb="md">
        <TextInput
          placeholder="Buscar en toda la tabla"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          className={styles.searchInput}
        />
        <Button
          variant="light"
          onClick={handleSyncUsers}
          className={styles.syncButton}
          loading={isLoading}
          leftSection={<IconRefresh />}
        >
          Sincronizar Usuarios
        </Button>
      </Group>
      <Table striped withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th
              onClick={() => handleSort("identification")}
              style={{ cursor: "pointer" }}
            >
              <Center inline>
                ID
                {sortConfig.key === "identification" ? (
                  sortConfig.direction === "asc" ? (
                    <IconArrowBigUpFilled
                      size={16}
                      style={{ marginLeft: "5px" }}
                    />
                  ) : (
                    <IconArrowBigDownFilled
                      size={16}
                      style={{ marginLeft: "5px" }}
                    />
                  )
                ) : (
                  <IconArrowsTransferDown
                    size={16}
                    style={{ marginLeft: "5px" }}
                  />
                )}
              </Center>
            </Table.Th>
            <Table.Th
              onClick={() => handleSort("full_name")}
              style={{ cursor: "pointer" }}
            >
              <Center inline>
                Nombre Completo
                {sortConfig.key === "full_name" ? (
                  sortConfig.direction === "asc" ? (
                    <IconArrowBigUpFilled
                      size={16}
                      style={{ marginLeft: "5px" }}
                    />
                  ) : (
                    <IconArrowBigDownFilled
                      size={16}
                      style={{ marginLeft: "5px" }}
                    />
                  )
                ) : (
                  <IconArrowsTransferDown
                    size={16}
                    style={{ marginLeft: "5px" }}
                  />
                )}
              </Center>
            </Table.Th>
            <Table.Th>Posición</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Roles</Table.Th>
            <Table.Th>
              <Center>Acciones</Center>
            </Table.Th>
            <Table.Th>
              <Center>Estado</Center>
            </Table.Th>
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
        <Group mb="md">
          <Button onClick={handleSave}>Guardar</Button>
          <Button variant="outline" onClick={() => setModalOpened(false)}>
            Cancelar
          </Button>
        </Group>
        <MultiSelect
          label="Roles"
          placeholder="Selecciona roles"
          data={["Usuario", "Administrador", "Responsable"]}
          value={roles}
          onChange={setRoles}
        />
      </Modal>
      <Modal
        opened={migrateModalOpened}
        onClose={() => {
          setMigrateModalOpened(false);
          setSelectedUser(null);
          setNewDependency(undefined);
        }}
        title={<Title size={"sm"}>Migrar Usuario de Dependencia</Title>}
      >
        <TextInput
          disabled
          label="Funcionario"
          value={selectedUser?.full_name}
        />
        <TextInput disabled label="Email" value={selectedUser?.email} />
        <TextInput
          disabled
          label="Dependencia Actual"
          value={
            dependencies.find((dep) => dep.dep_code === selectedUser?.dep_code)
              ?.name
          }
        />
        <Select
          label="Dependencia Nueva"
          placeholder="Selecciona una dependencia"
          data={dependencies.map((dep) => ({
            value: dep.dep_code,
            label: dep.name,
          }))}
          onChange={(value) =>
            setNewDependency(dependencies.find((dep) => dep.dep_code === value))
          }
          value={newDependency?.dep_code}
          searchable
        />
        <Group mt="md">
          <Button leftSection={<IconDeviceFloppy />} onClick={handleMigration}>
            Guardar
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setMigrateModalOpened(false);
              setSelectedUser(null);
              setNewDependency(undefined);
            }}
            leftSection={<IconCancel />}
            color="red"
          >
            Cancelar
          </Button>
        </Group>
      </Modal>
    </Container>
  );
};

export default AdminUsersPage;
