"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Button, Group, Text, Table, ActionIcon, ScrollArea, Title, Input } from "@mantine/core";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { useSession } from "next-auth/react";

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

const ProducerTemplateFormPage = ({ params }: { params: { id_template: string } }) => {
  const { id_template } = params;
  const { data: session } = useSession();
  const router = useRouter();
  const [publishedTemplateName, setPublishedTemplateName] = useState<string>("");
  const [template, setTemplate] = useState<Template | null>(null);
  const [rows, setRows] = useState<Record<string, any>[]>([{}]);

  const fetchTemplate = async () => {
    try {
      const response = await axios.get<PublishedTemplateResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/pTemplates/template/${id_template}`
      );
      setPublishedTemplateName(response.data.name);
      setTemplate(response.data.template);
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
    updatedRows[rowIndex][fieldName] = value;
    setRows(updatedRows);
  };

  const addRow = () => {
    setRows([...rows, {}]);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/pTemplates/submit`, {
        templateId: id_template,
        email: session?.user?.email,
        data: rows,
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

  if (!template) {
    return <Text ta="center" c="dimmed">Cargando Información...</Text>;
  }

  return (
    <Container size="xl">
      <Title ta="center" mb="md">{`Completar Plantilla: ${publishedTemplateName}`}</Title>
      <ScrollArea>
        <Table withColumnBorders withRowBorders>
          <Table.Thead>
            <Table.Tr>
              {template.fields.map((field) => (
                <Table.Th key={field.name}>{field.name}</Table.Th>
              ))}
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row, rowIndex) => (
              <Table.Tr key={rowIndex}>
                {template.fields.map((field) => (
                  <Table.Td key={field.name}>
                    <Input 
                      type="text"
                      value={row[field.name] || ""}
                      onChange={(e) =>
                        handleInputChange(rowIndex, field.name, e.target.value)
                      }
                      required={field.required}
                      placeholder={field.comment}
                    />
                  </Table.Td>
                ))}
                <Table.Td>
                  <ActionIcon color="red" onClick={() => removeRow(rowIndex)}>
                    <IconTrash size={16} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>
      <Group mt="md">
        <Button variant="outline" onClick={() => router.push('/producer/templates')}>
          Cancelar
        </Button>
        <Group>
          <Button variant="light" onClick={addRow}>
            <IconPlus size={16} /> Agregar Fila
          </Button>
          <Button onClick={handleSubmit}>Enviar</Button>
        </Group>
      </Group>
    </Container>
  );
};

export default ProducerTemplateFormPage;
