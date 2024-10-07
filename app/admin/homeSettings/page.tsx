"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Table,
  Button,
  Modal,
  TextInput,
  Group,
  Title,
  Accordion,
  AccordionItem,
  Text,
  Center,
} from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import {
  IconCirclePlus,
  IconEdit,
  IconTrash,
  IconDeviceFloppy,
  IconCancel,
} from "@tabler/icons-react";

interface AccordionSection {
  _id: string;
  title: string;
  description: string;
  order: number;
}

const AdminHomeSections = () => {
  const [sections, setSections] = useState<AccordionSection[]>([]);
  const [opened, setOpened] = useState(false);
  const [selectedSection, setSelectedSection] = useState<AccordionSection | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState<number>(1);

  const fetchSections = async () => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/homeInfo`);
      setSections(response.data);
    } catch (error) {
      console.error("Error fetching sections:", error);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const handleCreateOrUpdate = async () => {
    if (!title || !description) {
      showNotification({
        title: "Error",
        message: "El título y la descripción son requeridos",
        color: "red",
      });
      return;
    }

    try {
      if (selectedSection) {
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/homeInfo/${selectedSection._id}`, { title, description, order });
        showNotification({
          title: "Actualizado",
          message: "Sección actualizada correctamente",
          color: "green",
        });
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/homeInfo`, { title, description, order });
        showNotification({
          title: "Creado",
          message: "Sección creada correctamente",
          color: "green",
        });
      }
      fetchSections();
      handleModalClose();
    } catch (error) {
      console.error("Error creating/updating section:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al crear/actualizar la sección",
        color: "red",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/homeInfo/${id}`);
      showNotification({
        title: "Eliminado",
        message: "Sección eliminada correctamente",
        color: "green",
      });
      fetchSections();
    } catch (error) {
      console.error("Error deleting section:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al eliminar la sección",
        color: "red",
      });
    }
  };

  const handleModalClose = () => {
    setOpened(false);
    setTitle("");
    setDescription("");
    setOrder(1);
    setSelectedSection(null);
  };

  return (
    <Container size="xl">
      <Title ta="center" mb="md">Gestión de Secciones del Acordeón</Title>
      <Group mb="md">
        <Button
          onClick={() => {
            setSelectedSection(null);
            setOpened(true);
          }}
          leftSection={<IconCirclePlus />}
        >
          Añadir Nueva Sección
        </Button>
      </Group>
      <Accordion variant="separated" mb="lg">
        {sections.map((section) => (
          <AccordionItem key={section._id} value={section._id}>
            <Accordion.Control>
              {section.title}
              <Group>
                <Button variant="subtle" onClick={() => {
                  setSelectedSection(section);
                  setTitle(section.title);
                  setDescription(section.description);
                  setOrder(section.order);
                  setOpened(true);
                }}>
                  <IconEdit size={16} />
                </Button>
                <Button variant="subtle" color="red" onClick={() => handleDelete(section._id)}>
                  <IconTrash size={16} />
                </Button>
              </Group>
            </Accordion.Control>
            <Accordion.Panel>
              <Text>{section.description}</Text>
            </Accordion.Panel>
          </AccordionItem>
        ))}
      </Accordion>

      <Modal opened={opened} onClose={handleModalClose} title="Editar Sección">
        <TextInput
          label="Título"
          placeholder="Título de la sección"
          value={title}
          onChange={(e) => setTitle(e.currentTarget.value)}
          required
        />
        <TextInput
          label="Descripción"
          placeholder="Descripción de la sección"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          required
        />
        <TextInput
          label="Orden"
          type="number"
          value={order}
          onChange={(e) => setOrder(parseInt(e.currentTarget.value))}
          required
        />
        <Group mt="md" grow>
          <Button onClick={handleCreateOrUpdate} leftSection={<IconDeviceFloppy />}>
            Guardar
          </Button>
          <Button onClick={handleModalClose} variant="light" color="red" leftSection={<IconCancel />}>
            Cancelar
          </Button>
        </Group>
      </Modal>
    </Container>
  );
};

export default AdminHomeSections;
