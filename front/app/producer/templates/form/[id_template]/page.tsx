"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Button, Group, TextInput, Title, Text, Select, NumberInput } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { useSession } from "next-auth/react";
import 'dayjs/locale/es';

interface Field {
  name: string;
  datatype: string;
  required: boolean;
  validate_with?: string;
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
  const [formValues, setFormValues] = useState<Record<string, any>>({});

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

  const handleChange = (fieldName: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async () => {
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/pTemplates/submit`, {
        templateId: id_template,
        email: session?.user?.email,
        data: formValues,
      });
      showNotification({
        title: "Éxito",
        message: "Datos enviados exitosamente",
        color: "teal",
      });
      router.push('/producer/templates/uploaded');
    } catch (error) {
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

  const renderInputField = (field: Field) => {
    switch (field.datatype) {
      case "Entero":
        return (
          <NumberInput
            key={field.name}
            label={field.name}
            description={field.comment}
            value={formValues[field.name] || ""}
            onChange={(value) => handleChange(field.name, value)}
            required={field.required}
            withAsterisk={field.required}
            mb="md"
          />
        );
      case "Texto Corto":
      case "Texto Largo":
        return (
          <TextInput
            key={field.name}
            label={field.name}
            description={field.comment}
            value={formValues[field.name] || ""}
            onChange={(event) => handleChange(field.name, event.currentTarget.value)}
            required={field.required}
            withAsterisk={field.required}
            mb="md"
          />
        );
      case "True/False":
        return (
          <Select
            key={field.name}
            label={field.name}
            description={field.comment}
            data={[
              { value: "true", label: "Sí" },
              { value: "false", label: "No" },
            ]}
            value={formValues[field.name] || ""}
            onChange={(value) => handleChange(field.name, value)}
            required={field.required}
            withAsterisk={field.required}
            mb="md"
          />
        );
      case "Fecha":
        return (
          <DateInput
            key={field.name}
            label={field.name}
            description={field.comment}
            value={formValues[field.name] || null}
            onChange={(value) => handleChange(field.name, value)}
            required={field.required}
            withAsterisk={field.required}
            mb="md"
            locale="es"
          />
        );
      default:
        return (
          <TextInput
            key={field.name}
            label={field.name}
            description={field.comment}
            value={formValues[field.name] || ""}
            onChange={(event) => handleChange(field.name, event.currentTarget.value)}
            required={field.required}
            withAsterisk={field.required}
            mb="md"
          />
        );
    }
  };

  return (
    <Container size="xl">
      <Title ta="center" mb="md">{`Completar Plantilla: ${publishedTemplateName}`}</Title>
      {template.fields.map(renderInputField)}
      <Group mt="xl">
        <Button variant="outline" onClick={() => router.push('/producer/templates')}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>
          Enviar
        </Button>
      </Group>
    </Container>
  );
};

export default ProducerTemplateFormPage;
