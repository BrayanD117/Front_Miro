"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, TextInput, Button, Group, Switch, Table, Checkbox, Select } from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { useSession } from "next-auth/react";

interface Field {
  name: string;
  datatype: string;
  required: boolean;
  validate_with?: string;
  comment?: string;
}

type FieldKey = "name" | "datatype" | "required" | "validate_with" | "comment";

const allowedDataTypes = [
  "Entero",
  "Decimal",
  "Porcentaje",
  "Texto Corto",
  "Texto Largo",
  "True/False",
  "Fecha",
  "Fecha Inicial / Fecha Final",
  "Link"
];

const CreateTemplatePage = () => {
  const [name, setName] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [fields, setFields] = useState<Field[]>([{ name: "", datatype: "", required: true, validate_with: "", comment: "" }]);
  const [active, setActive] = useState(true);
  const [dimension, setDimension] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<string[]>([]);
  const router = useRouter();
  const { data: session } = useSession();

  useEffect(() => {
    const fetchDimensions = async () => {
      const userRole = localStorage.getItem('userRole');
      const userEmail = session?.user?.email || localStorage.getItem('userEmail');
      try {
        if (userRole === 'Administrador') {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dimensions`);
          setDimensions(response.data.map((dim: any) => dim.name));
        } else if (userRole === 'Responsable') {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dimensions/responsible`, {
            params: { email: userEmail }
          });
          const userDimensions = response.data.map((dim: any) => dim.name);
          setDimensions(userDimensions);
          if (userDimensions.length > 0) {
            setDimension(userDimensions[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching dimensions:", error);
        showNotification({
          title: "Error",
          message: "Hubo un error al obtener las dimensiones",
          color: "red",
        });
      }
    };

    if (session) {
      fetchDimensions();
    }
  }, [session]);

  const handleFieldChange = (index: number, field: FieldKey, value: any) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], [field]: value };
    setFields(updatedFields);
  };

  const addField = () => {
    setFields([...fields, { name: "", datatype: "", required: true, validate_with: "", comment: "" }]);
  };

  const removeField = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    setFields(updatedFields);
  };

  const handleSave = async () => {
    if (!name || !fileName || !fileDescription || fields.length === 0 || !dimension) {
      showNotification({
        title: "Error",
        message: "Todos los campos son requeridos",
        color: "red",
      });
      return;
    }

    const userEmail = session?.user?.email || localStorage.getItem('userEmail');

    if (!userEmail) {
      showNotification({
        title: "Error",
        message: "Usuario no autenticado",
        color: "red",
      });
      return;
    }

    const templateData = {
      name,
      file_name: fileName,
      file_description: fileDescription,
      fields,
      active,
      email: userEmail,
      dimension,
    };

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/templates/create`, templateData);
      showNotification({
        title: "Creado",
        message: "Plantilla creada exitosamente",
        color: "teal",
      });
      router.back();
    } catch (error) {
      console.error("Error guardando plantilla:", error);

      if (axios.isAxiosError(error) && error.response && error.response.data.mensaje) {
        showNotification({
          title: "Error",
          message: error.response.data.mensaje,
          color: "red",
        });
      } else {
        showNotification({
          title: "Error",
          message: "Hubo un error al guardar la plantilla",
          color: "red",
        });
      }
    }
  };

  const userRole = localStorage.getItem('userRole');

  return (
    <Container size="xl">
      <TextInput
        label="Nombre"
        placeholder="Nombre de la plantilla"
        value={name}
        onChange={(event) => setName(event.currentTarget.value)}
        mb="md"
      />
      <TextInput
        label="Nombre del Archivo"
        placeholder="Nombre del archivo"
        value={fileName}
        onChange={(event) => setFileName(event.currentTarget.value)}
        mb="md"
      />
      <TextInput
        label="Descripción del Archivo"
        placeholder="Descripción del archivo"
        value={fileDescription}
        onChange={(event) => setFileDescription(event.currentTarget.value)}
        mb="md"
      />
      {userRole === 'Administrador' && (
        <Select
          label="Dimensión"
          placeholder="Seleccionar dimensión"
          data={dimensions}
          value={dimension}
          onChange={(value) => setDimension(value || null)}
          mb="md"
        />
      )}
      {userRole === 'Responsable' && (
        <TextInput
          label="Dimensión"
          value={dimension || ""}
          readOnly
          mb="md"
        />
      )}
      <Switch
        label="Activo"
        checked={active}
        onChange={(event) => setActive(event.currentTarget.checked)}
        mb="md"
      />
      <Table stickyHeader withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nombre Campo</Table.Th>
            <Table.Th>Tipo de Campo</Table.Th>
            <Table.Th>¿Obligatorio?</Table.Th>
            <Table.Th>Validar con Base de Datos</Table.Th>
            <Table.Th>Comentario del Campo / Pista</Table.Th>
            <Table.Th>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {fields.map((field, index) => (
            <Table.Tr key={index}>
              <Table.Td>
                <TextInput
                  placeholder="Nombre del campo"
                  value={field.name}
                  onChange={(event) => handleFieldChange(index, "name", event.currentTarget.value)}
                />
              </Table.Td>
              <Table.Td>
                <Select
                  placeholder="Seleccionar"
                  data={allowedDataTypes}
                  value={field.datatype}
                  onChange={(value) => handleFieldChange(index, "datatype", value || "")}
                />
              </Table.Td>
              <Table.Td>
                <Checkbox
                  label=""
                  checked={field.required}
                  onChange={(event) => handleFieldChange(index, "required", event.currentTarget.checked)}
                />
              </Table.Td>
              <Table.Td>
                <TextInput
                  placeholder="Validar con"
                  value={field.validate_with}
                  onChange={(event) => handleFieldChange(index, "validate_with", event.currentTarget.value)}
                />
              </Table.Td>
              <Table.Td>
                <TextInput
                  placeholder="Comentario"
                  value={field.comment}
                  onChange={(event) => handleFieldChange(index, "comment", event.currentTarget.value)}
                />
              </Table.Td>
              <Table.Td>
                <Button color="red" onClick={() => removeField(index)}>
                  Eliminar
                </Button>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <Group mt="md">
        <Button onClick={addField}>
          Añadir Campo
        </Button>
      </Group>
      <Group mt="md">
        <Button onClick={handleSave}>Guardar</Button>
        <Button variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
      </Group>
    </Container>
  );
};

export default CreateTemplatePage;
