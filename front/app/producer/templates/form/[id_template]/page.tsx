"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Button, Group, TextInput, Title, Text, Select, NumberInput, ActionIcon } from "@mantine/core";
import { IconEye } from "@tabler/icons-react";
import { DateInput } from "@mantine/dates";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { useSession } from "next-auth/react";
import { ValidatorPanel } from "./ValidatorPanel";
import { ValidatorModal } from "./ValidatorModal";
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

const ProducerTemplateFormPage = ({ params }: { params: { id_template: string } }) => {
  const { id_template } = params;
  const { data: session } = useSession();
  const router = useRouter();
  const [publishedTemplateName, setPublishedTemplateName] = useState<string>("");
  const [template, setTemplate] = useState<Template | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [currentValidatorId, setCurrentValidatorId] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);

  const fetchTemplate = async () => {
    console.log("Fetching template data...");
    try {
      const response = await axios.get<PublishedTemplateResponse>(
        `${process.env.NEXT_PUBLIC_API_URL}/pTemplates/template/${id_template}`
      );
      console.log("Template data:", response.data);
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

    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [id_template]);

  const handleChange = (fieldName: string, value: any) => {
    let newValue = value;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      newValue = "";
    }
    setFormValues((prev) => ({ ...prev, [fieldName]: newValue }));
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

  const openValidatorPanelOrModal = (validatorId: string) => {
    console.log(`Opening validator with ID: ${validatorId}`);
    setCurrentValidatorId(validatorId);
  };

  if (!template) {
    return <Text ta="center" c="dimmed">Cargando Información...</Text>;
  }

  const renderInputField = (field: Field) => {
    const commonProps = {
      label: field.name,
      description: field.comment,
      value: formValues[field.name] || "",
      onChange: (event: any) => handleChange(field.name, event.currentTarget?.value || event),
      required: field.required,
      withAsterisk: field.required,
      mb: "md",
    };
  
    return (
      <div key={field.name} style={{ position: 'relative' }}>
        {(() => {
          switch (field.datatype) {
            case "Entero":
              return <NumberInput key={field.name} {...commonProps} />;
            case "Texto Corto":
            case "Texto Largo":
              return <TextInput key={field.name} {...commonProps} />;
            case "True/False":
              return (
                <Select
                  key={field.name}
                  {...commonProps}
                  data={[
                    { value: "true", label: "Sí" },
                    { value: "false", label: "No" },
                  ]}
                />
              );
            case "Fecha":
              return (
                <DateInput
                  key={field.name}
                  {...commonProps}
                  locale="es"
                  maxDate={new Date()}
                />
              );
            default:
              return <TextInput key={field.name} {...commonProps} />;
          }
        })()}
        {field.validate_with && (
          <ActionIcon
            onClick={() => openValidatorPanelOrModal(field.validate_with?.id!)}
            style={{ position: 'absolute', right: 10, top: 38 }}
            title="Ver valores aceptados"
          >
            <IconEye />
          </ActionIcon>
        )}
      </div>
    );
  };  

  return (
    <Container size="xl" style={{ display: 'flex' }}>
      <div style={{ flex: 1 }}>
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
      </div>

      {!isMobileView && currentValidatorId && (
        <ValidatorPanel
          validatorId={currentValidatorId}
          onClose={() => setCurrentValidatorId(null)}
        />
      )}

      {isMobileView && currentValidatorId && (
        <ValidatorModal
          opened={!!currentValidatorId}
          onClose={() => setCurrentValidatorId(null)}
          validatorId={currentValidatorId}
        />
      )}
    </Container>
  );
};

export default ProducerTemplateFormPage;
