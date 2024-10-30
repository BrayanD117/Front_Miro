"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, TextInput, Button, Group, Switch, Table, Checkbox, Select, MultiSelect } from "@mantine/core";
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
  "Link"
];

interface Dimension {
  _id: string;
  name: string;
}

interface ValidatorOption {
  name: string;
  type: string;
}

const CreateTemplatePage = () => {
  const [name, setName] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  const [fields, setFields] = useState<Field[]>([
    { name: "", datatype: "", required: true, validate_with: "", comment: "" },
  ]);
  const [active, setActive] = useState(true);
  const [selectedDimensions, setSelectedDimensions] = useState<Dimension[]>();
  const [dimensions, setDimensions] = useState<Dimension[]>([]);
  const [validatorOptions, setValidatorOptions] = useState<ValidatorOption[]>(
    []
  );
  const router = useRouter();
  const { data: session } = useSession();
  const { userRole } = useRole(); 

  useEffect(() => {
    const fetchDimensions = async () => {
      const userEmail = session?.user?.email;

      try {
        if (userRole === "Administrador") {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/dimensions`
          );
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

    const fetchValidatorOptions = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/validators/options`
        );
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

    if (session) {
      fetchDimensions();
      fetchValidatorOptions();
    }
  }, [session, userRole]);


  useEffect(() => {
    console.log(selectedDimensions);
  }, [selectedDimensions]);  

  const handleFieldChange = (index: number, field: FieldKey, value: any) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], [field]: value };

    if (field === "validate_with") {
      const selectedOption = validatorOptions.find(
        (option) => option.name === value
      );

      if (selectedOption) {
        if (selectedOption.type === "Número") {
          updatedFields[index].datatype = "Entero";
        } else if (selectedOption.type === "Texto") {
          updatedFields[index].datatype = "Texto Largo";
        }
      } else {
        updatedFields[index].datatype = "";
      }
    }

    setFields(updatedFields);
  };

  const addField = () => {
    setFields([
      ...fields,
      {
        name: "",
        datatype: "",
        required: true,
        validate_with: "",
        comment: "",
      },
    ]);
  };

  const removeField = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    setFields(updatedFields);
  };

  const handleSave = async () => {
    if (
      !name ||
      !fileName ||
      !fileDescription ||
      fields.length === 0 ||
      selectedDimensions?.length === 0
    ) {
      showNotification({
        title: "Error",
        message: "Todos los campos son requeridos",
        color: "red",
      });
      return;
    }

    const userEmail = session?.user?.email;

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
      dimensions: selectedDimensions?.map((dim) => dim._id),
    };

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/templates/create`,
        templateData
      );
      showNotification({
        title: "Creado",
        message: "Plantilla creada exitosamente",
        color: "teal",
      });
      router.back();
    } catch (error) {
      console.error("Error guardando plantilla:", error);

      if (
        axios.isAxiosError(error) &&
        error.response &&
        error.response.data.mensaje
      ) {
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
      mb="sm"
      />
      {userRole === "Administrador" && (
      <MultiSelect
        mb={'xl'}
        label="Dimensiones"
        placeholder="Seleccionar dimensiones"
        data={dimensions.map((dim) => ({ value: dim._id, label: dim.name }))}
        onChange={(value) => {
          const dims = dimensions.filter(dim => value.includes(dim._id));
          setSelectedDimensions(dims);
        }}
        value={selectedDimensions?.map((dim) => dim._id)}
        searchable
      />
      )}
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
        {fields.map((field, index) => {
        return (
          <Table.Tr key={index}>
          <Table.Td>
            <TextInput
            placeholder="Nombre del campo"
            value={field.name}
            onChange={(event) =>
              handleFieldChange(
              index,
              "name",
              event.currentTarget.value
              )
            }
            />
          </Table.Td>
          <Table.Td>
            <Select
            placeholder="Seleccionar"
            data={allowedDataTypes.map((type) => ({
              value: type,
              label: type,
            }))}
            value={field.datatype}
            onChange={(value) =>
              handleFieldChange(index, "datatype", value || "")
            }
            readOnly={!!field.validate_with}
            />
          </Table.Td>
          <Table.Td>
            <Checkbox
            label=""
            checked={field.required}
            onChange={(event) =>
              handleFieldChange(
              index,
              "required",
              event.currentTarget.checked
              )
            }
            />
          </Table.Td>
          <Table.Td>
            <Select
            placeholder="Validar con"
            data={validatorOptions.map((option) => ({
              value: option.name,
              label: option.name,
            }))}
            value={field.validate_with}
            onChange={(value) =>
              handleFieldChange(index, "validate_with", value || "")
            }
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
            onChange={(event) =>
              handleFieldChange(
              index,
              "comment",
              event.currentTarget.value
              )
            }
            />
          </Table.Td>
          <Table.Td>
            <Button color="red" onClick={() => removeField(index)}>
            Eliminar
            </Button>
          </Table.Td>
          </Table.Tr>
        );
        })}
      </Table.Tbody>
      </Table>
      <Group mt="md">
      <Button onClick={addField}>Añadir Campo</Button>
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
