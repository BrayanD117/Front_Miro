"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Container, TextInput, Button, Group, Switch, Stack, Text, Select, Checkbox } from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";

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

const AdminCreateTemplatePage = () => {
  const [name, setName] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [fields, setFields] = useState<Field[]>([{ name: "", datatype: "", required: true, validate_with: "", comment: "" }]);
  const [active, setActive] = useState(true);
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    const fetchTemplate = async () => {
      if (id) {
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/templates/${id}`);
          if (response.data) {
            setName(response.data.name);
            setFileName(response.data.file_name);
            setFileDescription(response.data.file_description);
            setFields(response.data.fields);
            setActive(response.data.active);
          }
        } catch (error) {
          console.error("Error fetching template:", error);
        }
      }
    };
    fetchTemplate();
  }, [id]);

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
    if (!name || !fileName || !fileDescription || fields.length === 0) {
      showNotification({
        title: "Error",
        message: "Todos los campos son requeridos",
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
    };

    try {
      if (id) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/templates/${id}`, templateData);
        showNotification({
          title: "Actualizado",
          message: "Plantilla actualizada exitosamente",
          color: "teal",
        });
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/templates/create`, templateData);
        showNotification({
          title: "Creado",
          message: "Plantilla creada exitosamente",
          color: "teal",
        });
      }
      router.push("/admin/templates");
    } catch (error) {
      console.error("Error guardando plantilla:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al guardar la plantilla",
        color: "red",
      });
    }
  };

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
      <Switch
        label="Activo"
        checked={active}
        onChange={(event) => setActive(event.currentTarget.checked)}
        mb="md"
      />
      <Stack>
        {fields.map((field, index) => (
          <Group key={index} grow>
            <TextInput
              label="Nombre Campo"
              placeholder="Nombre del campo"
              value={field.name}
              onChange={(event) => handleFieldChange(index, "name", event.currentTarget.value)}
            />
            <Select
              label="Tipo de Campo"
              placeholder="Seleccionar"
              data={allowedDataTypes}
              value={field.datatype}
              onChange={(value) => handleFieldChange(index, "datatype", value)}
            />
            <Checkbox
              label="¿Obligatorio?"
              checked={field.required}
              onChange={(event) => handleFieldChange(index, "required", event.currentTarget.checked)}
            />
            <TextInput
              label="Validar con Base de Datos"
              placeholder="Validar con"
              value={field.validate_with}
              onChange={(event) => handleFieldChange(index, "validate_with", event.currentTarget.value)}
            />
            <TextInput
              label="Comentario del Campo / Pista"
              placeholder="Comentario"
              value={field.comment}
              onChange={(event) => handleFieldChange(index, "comment", event.currentTarget.value)}
            />
            <Button color="red" onClick={() => removeField(index)}>
              Eliminar
            </Button>
          </Group>
        ))}
        <Button mt="md" onClick={addField}>
          Añadir Campo
        </Button>
      </Stack>
      <Group mt="md">
        <Button onClick={handleSave}>Guardar</Button>
        <Button variant="outline" onClick={() => router.push("/admin/templates")}>
          Cancelar
        </Button>
      </Group>
    </Container>
  );
};

export default AdminCreateTemplatePage;
