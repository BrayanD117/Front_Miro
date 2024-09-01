"use client";

import { useEffect, useState } from "react";
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
  Modal,
  Center,
  Textarea,
  Switch,
} from "@mantine/core";
import { IconPlus, IconTrash, IconEye } from "@tabler/icons-react";
import { DateInput } from "@mantine/dates";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { useSession } from "next-auth/react";
import { ValidatorModal } from "../../../../components/Validators/ValidatorModal";
import 'dayjs/locale/es';

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
  const [validatorModalOpen, setValidatorModalOpen] = useState(false);
  const [validatorData, setValidatorData] = useState<ValidatorData | null>(null);
  const [validatorExists, setValidatorExists] = useState<Record<string, boolean>>({});

  const fetchTemplate = async () => {
    try {
      const response = await axios.get<PublishedTemplateResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/pTemplates/template/${id_template}`
      );
      setPublishedTemplateName(response.data.name);
      setTemplate(response.data.template);

      // Verificar la existencia de los validadores
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
  };

  const addRow = () => {
    setRows([...rows, {}]);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
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
      showNotification({
        title: "Error",
        message: "No se pudo enviar la información",
        color: "red",
      });
    }
  };

  const renderInputField = (field: Field, row: Record<string, any>, rowIndex: number) => {
    const commonProps = {
      value: row[field.name] || "",
      onChange: (e: any) => handleInputChange(rowIndex, field.name, e.currentTarget?.value || e),
      required: field.required,
      placeholder: field.comment,
    };

    switch (field.datatype) {
      case "Entero":
      case "Decimal":
      case "Porcentaje":
        return (
          <NumberInput
            {...commonProps}
            value={row[field.name] || ""}
            min={0}
            step={field.datatype === "Porcentaje" ? 0.01 : 1}
            hideControls
            onChange={(value) => handleInputChange(rowIndex, field.name, value)}
          />
        );
      case "Texto Largo":
        return (
          <Textarea
            {...commonProps}
            resize="vertical"
            value={row[field.name] === null ? "" : row[field.name]}
            onChange={(e) => handleInputChange(rowIndex, field.name, e.target.value)}
          />
        );
      case "Texto Corto":
      case "Link":
        return (
          <TextInput
            {...commonProps}
            value={row[field.name] === null ? "" : row[field.name]}
            onChange={(e) => handleInputChange(rowIndex, field.name, e.target.value)}
          />
        );
      case "True/False":
        return (
          <Switch
            {...commonProps}
            checked={row[field.name] || false}
            onChange={(event) => handleInputChange(rowIndex, field.name, event.currentTarget.checked)}
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
          />
        );
      default:
        return (
          <TextInput
            {...commonProps}
            value={row[field.name] === null ? "" : row[field.name]}
            onChange={(e) => handleInputChange(rowIndex, field.name, e.target.value)}
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
      <ScrollArea>
        <Table withTableBorder withColumnBorders withRowBorders>
          <Table.Thead>
            <Table.Tr>
              {template.fields.map((field) => (
                <Table.Th key={field.name}>
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
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row, rowIndex) => (
              <Table.Tr key={rowIndex}>
                {template.fields.map((field) => (
                  <Table.Td key={field.name}>
                    <Group align="center">
                      {renderInputField(field, row, rowIndex)}
                    </Group>
                  </Table.Td>
                ))}
                <Table.Td>
                  <Center>
                    <ActionIcon color="red" onClick={() => removeRow(rowIndex)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Center>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
      <Group justify="center" mt="md">
        <Button color={"red"} variant="outline" onClick={() => router.push('/producer/templates')}>
          Cancelar
        </Button>
        <Group>
          <Button variant="light" onClick={addRow}>
            <IconPlus size={16} /> Agregar Fila
          </Button>
          <Button onClick={handleSubmit}>Enviar</Button>
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
