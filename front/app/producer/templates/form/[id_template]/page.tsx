"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Button, Group, TextInput, Text, Title } from "@mantine/core";
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

const ProducerTemplateFormPage = ({ params }: { params: { id_template: string } }) => {
  const { id_template } = params;
  const { data: session } = useSession();
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const fetchTemplate = async () => {
    console.log("Fetching template with ID:", id_template);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/pTemplates/template/${id_template}`);
      console.log("API Response:", response);
      setTemplate(response.data);
      console.log("Template set:", response.data);
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
      console.log("Template ID is available:", id_template);
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
    console.log("Template is null, displaying loading message.");
    return <div>Cargando...</div>;
  }

  return (
    <Container size="sm">
      <Title ta="center" mb="md">{`Completar Plantilla: ${template.name}`}</Title>
      {template.fields.map((field) => (
        <div key={field.name} style={{ marginBottom: "1rem" }}>
          <TextInput
            label={field.name}
            value={formValues[field.name] || ""}
            onChange={(event) => handleChange(field.name, event.currentTarget.value)}
            required={field.required}
            withAsterisk={field.required}
          />
          {field.comment && (
            <Text size="sm" color="dimmed" mt={5}>
              {field.comment || "BUENAS"}
            </Text>
          )}
        </div>
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
