"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Button,
  Group,
  Text,
  Table,
  ActionIcon,
  ScrollArea,
  Title,
  TextInput,
  NumberInput,
  Center,
  Textarea,
  Switch,
  Tooltip,
  rem,
} from "@mantine/core";
import { IconPlus, IconTrash, IconEye, IconCancel, IconSend2 } from "@tabler/icons-react";
import { DateInput } from "@mantine/dates";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { useSession } from "next-auth/react";
import { ValidatorModal } from "../../../../components/Validators/ValidatorModal";

interface Field {
  name: string;
  datatype: string;
  required: boolean;
  validate_with?: { id: string, name: string };
  comment?: string;
}

interface Template {
  _id: string;
  name: string;
  fields: Field[];
}

interface PublishedTemplateResponse {
  name: string;
  template: Template;
}

interface ValidatorData {
  name: string;
  _id: string;
  columns: { name: string; is_validator: boolean; values: any[] }[];
}

const ProducerTemplateFormPage = ({ params }: { params: { id_template: string } }) => {
  const { id_template } = params;
  const { data: session } = useSession();
  const router = useRouter();
  const [publishedTemplateName, setPublishedTemplateName] = useState<string>("");
  const [template, setTemplate] = useState<Template | null>(null);
  const [rows, setRows] = useState<Record<string, any>[]>([{}]);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [validatorModalOpen, setValidatorModalOpen] = useState(false);
  const [validatorData, setValidatorData] = useState<ValidatorData | null>(null);
  const [validatorExists, setValidatorExists] = useState<Record<string, boolean>>({});
  const scrollAreaRef = useRef<HTMLDivElement | null>(null);

  const fetchTemplate = async () => {
    try {
      const response = await axios.get<PublishedTemplateResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/pTemplates/template/${id_template}`
      );
      setPublishedTemplateName(response.data.name);
      setTemplate(response.data.template);

      const validatorCheckPromises = response.data.template.fields.map(async (field) => {
        if (field.validate_with) {
          try {
            const validatorResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/validators/id?id=${field.validate_with.id}`);
            return { [field.name]: !!validatorResponse.data.validator };
          } catch {
            return { [field.name]: false };
          }
        }
        return { [field.name]: false };
      });

      const validatorChecks = await Promise.all(validatorCheckPromises);
      const validatorCheckResults = validatorChecks.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setValidatorExists(validatorCheckResults);

    } catch (error) {
      console.error("Error fetching template:", error);
      showNotification({
        title: "Error",
        message: "No se pudo cargar la plantilla",
        color: "red",
      });
    }
  };

  useEffect(() => {
    if (id_template) {
      fetchTemplate();
    }
  }, [id_template]);

  const handleInputChange = (rowIndex: number, fieldName: string, value: any) => {
    const updatedRows = [...rows];
    updatedRows[rowIndex][fieldName] = value === "" ? null : value;
    setRows(updatedRows);

    const updatedErrors = { ...errors };
    if (updatedErrors[fieldName]) {
      delete updatedErrors[fieldName];
      setErrors(updatedErrors);
    }
  };

  const addRow = () => {
    setRows([...rows, {}]);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const validateFields = () => {
    const newErrors: Record<string, string[]> = {};

    rows.forEach((row, rowIndex) => {
      template?.fields.forEach((field) => {
        if (field.required && (row[field.name] === null || row[field.name] === undefined)) {
          if (!newErrors[field.name]) {
            newErrors[field.name] = [];
          }
          newErrors[field.name][rowIndex] = "Este campo es obligatorio.";
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleValidatorOpen = async (validatorId: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/validators/id?id=${validatorId}`);
      setValidatorData(response.data.validator);
      setValidatorModalOpen(true);
    } catch (error) {
      showNotification({
        title: "Error",
        message: "No se pudieron cargar los datos de validación",
        color: "red",
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateFields()) {
      showNotification({
        title: "Error de Validación",
        message: "Por favor completa los campos obligatorios.",
        color: "red",
      });
      return;
    }

    try {
      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/pTemplates/producer/load`, {
        email: session?.user?.email,
        pubTem_id: id_template,
        data: rows,
        edit: false,
      });
      showNotification({
        title: "Éxito",
        message: "Datos enviados exitosamente",
        color: "teal",
      });
      router.push('/producer/templates/uploaded');
    } catch (error) {
      console.error("Error submitting data:", error);
      if (axios.isAxiosError(error) && error.response?.status === 400) {
        const validationErrors = error.response.data.details;
        const errorObject: Record<string, string[]> = {};

        validationErrors.forEach((error: { column: string, errors: { register: number, message: string }[] }) => {
          error.errors.forEach(err => {
            if (!errorObject[error.column]) {
              errorObject[error.column] = [];
            }
            errorObject[error.column][err.register - 1] = err.message;
          });
        });

        setErrors(errorObject);
        showNotification({
          title: "Error de Validación",
          message: "Algunos campos contienen errores. Por favor revisa y corrige.",
          color: "red",
        });
      }
    }
  };

  const renderInputField = (field: Field, row: Record<string, any>, rowIndex: number) => {
    const fieldError = errors[field.name]?.[rowIndex];
    const commonProps = {
      value: row[field.name] || "",
      onChange: (e: React.ChangeEvent<HTMLInputElement> | number) => handleInputChange(rowIndex, field.name, typeof e === "number" ? e : e.currentTarget.value),
      required: field.required,
      placeholder: field.comment,
      style: { width: "100%" },
      error: Boolean(fieldError),
    };

    switch (field.datatype) {
      case "Entero":
      case "Decimal":
      case "Porcentaje":
        const formattedValue = field.datatype === "Porcentaje" ? (row[field.name] ? `${row[field.name]}%` : "") : row[field.name];

        return (
          <NumberInput
            {...commonProps}
            value={formattedValue}
            min={0}
            step={field.datatype === "Porcentaje" ? 1 : 1}
            hideControls
            onChange={(value) => handleInputChange(rowIndex, field.name, value)}
            error={fieldError ? fieldError : undefined}
          />
        );
      case "Texto Largo":
        return (
          <Textarea
            {...commonProps}
            resize="vertical"
            value={row[field.name] === null ? "" : row[field.name]}
            onChange={(e) => handleInputChange(rowIndex, field.name, e.target.value)}
            error={fieldError ? fieldError : undefined}
          />
        );
      case "Texto Corto":
      case "Link":
        return (
          <TextInput
            {...commonProps}
            value={row[field.name] === null ? "" : row[field.name]}
            onChange={(e) => handleInputChange(rowIndex, field.name, e.target.value)}
            error={fieldError ? fieldError : undefined}
          />
        );
      case "True/False":
        return (
          <Switch
            {...commonProps}
            checked={row[field.name] === true}
            onChange={(event) => handleInputChange(rowIndex, field.name, event.currentTarget.checked)}
            error={fieldError ? fieldError : undefined}
          />
        );
      case "Fecha":
        return (
          <DateInput
            {...commonProps}
            value={row[field.name] ? new Date(row[field.name]) : null}
            locale="es"
            valueFormat="DD/MM/YYYY"
            onChange={(date) => handleInputChange(rowIndex, field.name, date)}
            error={fieldError ? fieldError : undefined}
          />
        );
      default:
        return (
          <TextInput
            {...commonProps}
            value={row[field.name] === null ? "" : row[field.name]}
            onChange={(e) => handleInputChange(rowIndex, field.name, e.target.value)}
            error={fieldError ? fieldError : undefined}
          />
        );
    }
  };

  if (!template) {
    return <Text ta="center" c="dimmed">Cargando Información...</Text>;
  }

  return (
    <Container size="xl">
      <Title ta="center" mb="md">{`Completar Plantilla: ${publishedTemplateName}`}</Title>
      <Tooltip
        label="Desplázate horizontalmente para ver todas las columnas"
        position="bottom"
        withArrow
        transitionProps={{ transition: "slide-up", duration: 300 }}
      >
        <ScrollArea viewportRef={scrollAreaRef}>
          <ScrollArea type="always" offsetScrollbars>
            <Table mb={"xs"} withTableBorder withColumnBorders withRowBorders>
              <Table.Thead>
                <Table.Tr>
                  {template.fields.map((field) => (
                    <Table.Th key={field.name} style={{ minWidth: '250px' }}>
                      <Group>
                        {field.name} {field.required && <Text span color="red">*</Text>}
                        {field.validate_with && (
                          <ActionIcon
                            size={"lg"}
                            onClick={() => handleValidatorOpen(field.validate_with?.id!)}
                            title="Ver valores aceptados"
                            disabled={!validatorExists[field.name]}
                          >
                            <IconEye />
                          </ActionIcon>
                        )}
                      </Group>
                    </Table.Th>
                  ))}
                  <Table.Th maw={rem(120)}><Center>Acciones</Center></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {rows.map((row, rowIndex) => (
                  <Table.Tr key={rowIndex}>
                    {template.fields.map((field) => (
                      <Table.Td key={field.name} style={{ minWidth: '250px' }}>
                        <Group align="center">
                          {renderInputField(field, row, rowIndex)}
                        </Group>
                      </Table.Td>
                    ))}
                    <Table.Td maw={rem(120)}>
                      <Center>
                        <Button
                          size={"xs"}
                          color="red"
                          onClick={() => removeRow(rowIndex)}
                          rightSection={<IconTrash/>}
                        >
                          Borrar
                        </Button>
                      </Center>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </ScrollArea>
      </Tooltip>
      <Group justify="center" mt={rem(50)}>
        <Button 
          color={"red"}
          variant="outline"
          onClick={() => router.push('/producer/templates')}
          leftSection={<IconCancel/>}
        >
          Cancelar
        </Button>
        <Group>
          <Button 
            variant="light" 
            onClick={addRow}
            leftSection={<IconPlus/>}
          >
            Agregar Fila
          </Button>
          <Button
            onClick={handleSubmit}
            rightSection={<IconSend2/>}
          >
            Enviar
          </Button>
        </Group>
      </Group>
      <ValidatorModal
        opened={validatorModalOpen}
        onClose={() => setValidatorModalOpen(false)}
        validatorId={validatorData?._id || ""}
      />
    </Container>
  );
};

export default ProducerTemplateFormPage;
