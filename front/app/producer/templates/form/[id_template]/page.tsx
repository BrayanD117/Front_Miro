"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Button, Group, TextInput, Title, Text } from "@mantine/core";
import LoadingScreen from "@/app/components/LoadingScreen";
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
    console.log("Changing field:", fieldName, "Value:", value);
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSubmit = async () => {
    console.log("Submitting form with values:", formValues);
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
      console.error("Error submitting data:", error);
      showNotification({
        title: "Error",
        message: "No se pudo enviar la información",
        color: "red",
      });
    }
  };

  if (!template) {
    return <Text ta={"center"} c={"dimmed"}>Cargando Información...</Text>;
  }

  return (
    <Container size="sm">
      <Title ta="center" mb="md">{`Completar Plantilla: ${publishedTemplateName}`}</Title>
      {template.fields.map((field) => (
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
      ))}
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
