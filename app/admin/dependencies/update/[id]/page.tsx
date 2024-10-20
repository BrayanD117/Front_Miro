"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Container,
  TextInput,
  Button,
  Group,
  Select,
  Table,
  Switch,
} from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";

interface Member {
  email: string;
  full_name: string;
  isProducer: boolean;
}

const AdminUpdateDependencyPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [dependency, setDependency] = useState({
    dep_code: "",
    name: "",
    responsible: "",
    dep_father: "",
    members: [] as string[],
  });
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (id) {
      const fetchDependency = async () => {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/dependencies/${id}`
          );
          setDependency(response.data);
          const membersResponse = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/dependencies/${response.data.dep_code}/members`
          );
          const membersWithProducerStatus = membersResponse.data.map((member: any) => ({
            email: member.email,
            full_name: member.full_name,
            isProducer: dependency.members.includes(member.email),
          }));
          setMembers(membersWithProducerStatus);
        } catch (error) {
          console.error("Error fetching dependency or members:", error);
        }
      };
      fetchDependency();
    }
  }, [id]);

  const handleSave = async () => {
    try {
      const producers = members.filter((member) => member.isProducer).map((member) => member.email);
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/dependencies/${id}`,
        { ...dependency, producers }
      );
      showNotification({
        title: "Actualizado",
        message: "Dependencia actualizada exitosamente",
        color: "teal",
      });
      router.push("/admin/dependencies");
    } catch (error) {
      console.error("Error updating dependency:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al actualizar la dependencia",
        color: "red",
      });
    }
  };

  const toggleProducer = (email: string) => {
    setMembers((prevMembers) =>
      prevMembers.map((member) =>
        member.email === email
          ? { ...member, isProducer: !member.isProducer }
          : member
      )
    );
  };

  return (
    <Container size="md">
      <TextInput
        label="Código"
        value={dependency.dep_code}
        readOnly
        mb="md"
      />
      <TextInput
        label="Dependencia Padre"
        value={dependency.dep_father}
        readOnly
        mb="md"
      />
      <TextInput
        label="Nombre"
        value={dependency.name}
        readOnly
        mb="md"
      />

      <Select
        label="Responsable"
        value={dependency.responsible}
        onChange={(value) => setDependency({ ...dependency, responsible: value ?? '' })}
        data={members.map((member) => ({
          value: member.email,
          label: member.full_name,
        }))}
        mb="md"
        allowDeselect={false}
        searchable
        nothingFoundMessage="No existe ningún miembro con ese nombre."
      />

      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Miembro</Table.Th>
            <Table.Th>Email</Table.Th>
            <Table.Th>Productor</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {members.map((member) => (
            <Table.Tr key={member.email}>
              <Table.Td>{member.full_name}</Table.Td>
              <Table.Td>{member.email}</Table.Td>
              <Table.Td>
                <Switch
                  checked={member.isProducer}
                  onChange={() => toggleProducer(member.email)}
                />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>

      <Group mt="md">
        <Button onClick={handleSave}>Guardar</Button>
        <Button variant="outline" onClick={() => router.push("/admin/dependencies")}>
          Cancelar
        </Button>
      </Group>
    </Container>
  );
};

export default AdminUpdateDependencyPage;
