"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Container, TextInput, Button, Group, Switch, Table, Checkbox, Select, Loader, Center, MultiSelect } from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { useSession } from "next-auth/react";
import { useRole } from "@/app/context/RoleContext";

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

interface Dependency {
  _id: string;
  name: string;
  responsible: string
}

interface Dimension {
  _id: string;
  name: string;
  responsible: Dependency
}

interface ValidatorOption {
  name: string;
  type: string;
}

const UpdateTemplatePage = () => {
  const [name, setName] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [fields, setFields] = useState<Field[]>([{ name: "", datatype: "", required: true, validate_with: "", comment: "" }]);
  const [active, setActive] = useState(true);
  const [dimension, setDimension] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [selectedDimensions, setSelectedDimensions] = useState<string[]>([]);
  const [dependencies, setDependencies] = useState<Dependency[]>([]);
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([]);
  const [validatorOptions, setValidatorOptions] = useState<ValidatorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = useParams();
  const { data: session } = useSession();
  const { userRole } = useRole();

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
            setSelectedDimensions(response.data.dimensions);
            setSelectedDependencies(response.data.producers);
          }
        } catch (error) {
          console.error("Error fetching template:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    const fetchDimensions = async () => {
      const userEmail = session?.user?.email;
      try {
        if (userRole === 'Administrador') {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/dimensions`);
          setDimensions(response.data);
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

    const fetchDependencies = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/dependencies/${session?.user?.email}`
        );
        setDependencies(response.data);
      } catch (error) {
        console.error("Error fetching dependencies:", error);
        showNotification({
          title: "Error",
          message: "Hubo un error al obtener las dependencias",
          color: "red",
        });
      }
    }

    const fetchValidatorOptions = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/validators/options`);
        setValidatorOptions(response.data.options);
      } catch (error) {
        console.error("Error fetching validator options:", error);
        showNotification({
          title: "Error",
          message: "Hubo un error al obtener las opciones de validación",
          color: "red",
        });
      }
    };

    fetchDependencies();
    fetchDimensions();
    fetchTemplate();
    fetchValidatorOptions();
  }, [id, session, userRole]);

  const handleFieldChange = (index: number, field: FieldKey, value: any) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], [field]: value };

    if (field === 'validate_with') {
      const selectedOption = validatorOptions.find(option => option.name === value);

      if (selectedOption) {
        if (selectedOption.type === 'Número') {
          updatedFields[index].datatype = 'Entero';
        } else if (selectedOption.type === 'Texto') {
          updatedFields[index].datatype = 'Texto Largo';
        }
      } else {
        updatedFields[index].datatype = "";
      }
    }

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

    const templateData = {
      name,
      file_name: fileName,
      file_description: fileDescription,
      fields,
      active,
      dimension,
    };

    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/templates/${id}`, templateData);
      showNotification({
        title: "Actualizado",
        message: "Plantilla actualizada exitosamente",
        color: "teal",
      });
      router.back();
    } catch (error: any) {
      console.error("Error guardando plantilla:", error);

      if(error.response.data.message) {
        showNotification({
          title: "Error",
          message: 'La plantilla se encuentra publicada y ya han hecho cargue de información, no se puede modificar',
          color: "red",
        });
      }
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

  if (loading) {
    return (
      <Center style={{ height: "100vh" }}>
        <Loader size="xl" />
      </Center>
    );
  }

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
      {userRole === "Administrador" && (
      <MultiSelect
        mb={'xs'}
        label="Dimensiones"
        placeholder="Seleccionar dimensiones"
        data={dimensions.map((dim) => ({ value: dim._id, label: dim.name }))}
        onChange={setSelectedDimensions}
        value={selectedDimensions}
        searchable
      />
      )}
      <MultiSelect
        mb={'xl'}
        label="Productores"
        placeholder="Seleccionar productores"
        data={dependencies?.map((dep) => ({ value: dep._id, label: dep.name }))}
        onChange={setSelectedDependencies}
        value={selectedDependencies}
        searchable
      />
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
                  readOnly={!!field.validate_with}
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
                <Select
                  placeholder="Validar con"
                  data={validatorOptions.map(option => ({ value: option.name, label: option.name }))}
                  value={field.validate_with}
                  onChange={(value) => handleFieldChange(index, "validate_with", value || "")}
                  maxDropdownHeight={200}
                  searchable
                  clearable
                  nothingFoundMessage="La validación no existe"
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

export default UpdateTemplatePage;
