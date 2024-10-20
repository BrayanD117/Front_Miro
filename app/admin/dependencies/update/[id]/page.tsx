"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Container, TextInput, Button, Group } from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";

const AdminUpdateDependencyPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [dependency, setDependency] = useState({
    dep_code: "",
    name: "",
    responsible: "",
    dep_father: "",
  });

  useEffect(() => {
    if (id) {
      const fetchDependency = async () => {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/dependencies/${id}`
          );
          setDependency(response.data);
          console.log("Dependency",response.data);
        } catch (error) {
          console.error("Error fetching dependency:", error);
        }
      };
      fetchDependency();
    }
  }, [id]);

  const handleSave = async () => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/dependencies/${id}`,
        dependency
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

  return (
    <Container size="md">
      <TextInput
        label="Código"
        value={dependency.dep_code}
        onChange={(e) =>
          setDependency({ ...dependency, dep_code: e.target.value })
        }
        mb="md"
        readOnly
      />
      <TextInput
        label="Dependencia Padre"
        value={dependency.dep_father}
        onChange={(e) =>
          setDependency({ ...dependency, dep_father: e.target.value })
        }
        mb="md"
        readOnly
      />
      <TextInput
        label="Nombre"
        value={dependency.name}
        onChange={(e) => setDependency({ ...dependency, name: e.target.value })}
        mb="md"
        readOnly
      />
      <TextInput
        label="Responsable"
        value={dependency.responsible}
        onChange={(e) =>
          setDependency({ ...dependency, responsible: e.target.value })
        }
        mb="md"
      />
      <Group mt="md">
        <Button onClick={handleSave}>Guardar</Button>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/dependencies")}
        >
          Cancelar
        </Button>
      </Group>
    </Container>
  );
};

export default AdminUpdateDependencyPage;
