"use client";

import { useEffect, useState } from "react";
import { Container, Table, Button, Modal, TextInput, Group, Pagination, Center, Select, MultiSelect, Text } from "@mantine/core";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import styles from "./AdminDependenciesPage.module.css";

interface Dependency {
  _id: string;
  dep_code: string;
  name: string;
  members: string[];
  responsible: string;
  dep_father: string;
}

interface MemberOption {
  value: string;
  label: string;
}

const AdminDependenciesPage = () => {
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [opened, setOpened] = useState(false);
  const [selectedDependency, setSelectedDependency] = useState<Dependency | null>(null);
  const [dep_code, setDepCode] = useState("");
  const [name, setName] = useState("");
  const [responsible, setResponsible] = useState<string | null>(null);
  const [dep_father, setDepFather] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [selectedProducers, setSelectedProducers] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchDependencies = async (page: number, search: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dependencies/all`, {
        params: { page, limit: 10, search },
      });
      if (response.data) {
        setDependencies(response.data.dependencies || []);
        setTotalPages(response.data.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching dependencies:", error);
      setDependencies([]);
    }
  };

  const fetchMembers = async (dep_code: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dependencies/${dep_code}/members`);
      if (response.data) {
        const memberOptions = response.data
          .filter((member: any) => member.email && member.email.includes('@') && member.email.split('@')[0].length > 0)
          .map((member: any) => ({
            value: member.email,
            label: `${member.full_name} (${member.email})`,
          }));
        setMembers(memberOptions);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  useEffect(() => {
    fetchDependencies(page, search);
  }, [page]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchDependencies(page, search);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleSyncDependencies = async () => {
    setIsLoading(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/users/updateAll`);
      showNotification({
        title: "Sincronizado",
        message: "Dependencias sincronizadas exitosamente",
        color: "teal",
      });
      fetchDependencies(page, search);
    } catch (error) {
      console.error("Error syncing dependencies:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al sincronizar las dependencias",
        color: "red",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (dependency: Dependency) => {
    setSelectedDependency(dependency);
    setDepCode(dependency.dep_code);
    setName(dependency.name);
    setResponsible(dependency.responsible);
    setDepFather(dependency.dep_father);
    setSelectedProducers(dependency.members); // Load current members
    fetchMembers(dependency.dep_code);
    setOpened(true);
  };

  const handleSave = async () => {
    if (!dep_code || !name) {
      showNotification({
        title: "Error",
        message: "El código y el nombre son requeridos",
        color: "red",
      });
      return;
    }

    try {
      const dependencyData = {
        dep_code,
        name,
        responsible,
        dep_father,
        producers: selectedProducers,
      };

      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/dependencies/${selectedDependency?._id}`, dependencyData);
      showNotification({
        title: "Actualizado",
        message: "Dependencia actualizada exitosamente",
        color: "teal",
      });

      handleModalClose();
      fetchDependencies(page, search);
    } catch (error) {
      console.error("Error actualizando dependencia:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al actualizar la dependencia",
        color: "red",
      });
    }
  };

  const handleModalClose = () => {
    setOpened(false);
    setDepCode("");
    setName("");
    setResponsible(null);
    setDepFather(null);
    setSelectedDependency(null);
    setSelectedProducers([]);
    setMembers([]);
  };

  const rows = dependencies.map((dependency) => (
    <Table.Tr key={dependency._id}>
      <Table.Td>{dependency.dep_code}</Table.Td>
      <Table.Td>{dependency.name}</Table.Td>
      <Table.Td>{dependency.responsible}</Table.Td>
      <Table.Td>{dependency.dep_father}</Table.Td>
      <Table.Td>
        <Center>
          <Group gap={5}>
            <Button variant="outline" onClick={() => handleEdit(dependency)}>
              <IconEdit size={16} />
            </Button>
          </Group>
        </Center>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl">
      <Group className={styles.customGroup} mb="md">
        <TextInput
          placeholder="Buscar en todas las dependencias"
          value={search}
          onChange={(event) => setSearch(event.currentTarget.value)}
          className={styles.searchInput}
        />
        <Button onClick={handleSyncDependencies} className={styles.syncButton} loading={isLoading}>
          Sincronizar Dependencias
        </Button>
      </Group>
      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Código</Table.Th>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Responsable</Table.Th>
            <Table.Th>Dependencia Padre</Table.Th>
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
        title={
          selectedDependency ? "Editar Dependencia" : "Crear Nueva Dependencia"
        }
      >
        <TextInput label="Código" value={dep_code} readOnly mb="md" />
        <TextInput label="Nombre" value={name} readOnly mb="md" />
        <TextInput
          label="Dependencia Padre"
          value={dep_father || ""}
          readOnly
          mb="md"
        />
        <Select
          label="Responsable"
          placeholder="Selecciona un responsable"
          data={members}
          value={responsible}
          onChange={setResponsible}
          searchable
          clearable
          mb="md"
        />
        <MultiSelect
          label="Productores"
          placeholder="Selecciona productores"
          data={members}
          value={selectedProducers}
          onChange={setSelectedProducers}
          searchable
        />
        <Group mt="md">
          <Button onClick={handleSave}>Guardar</Button>
          <Button variant="outline" onClick={handleModalClose}>
            Cancelar
          </Button>
        </Group>
      </Modal>
    </Container>
  );
};

export default AdminDependenciesPage;
