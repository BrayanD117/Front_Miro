"use client";

import { useState, useEffect } from "react";
import {
  Container,
  TextInput,
  Textarea,
  Button,
  Group,
  Title,
  Card,
  Paper,
  Grid,
  useMantineTheme,
  Box,
} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import axios from "axios";
import { IconEdit, IconTrash, IconDeviceFloppy } from "@tabler/icons-react";

interface AccordionSection {
  _id: string;
  title: string;
  description: string;
}

const AdminHomeSections = () => {
  const [sections, setSections] = useState<AccordionSection[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedSection, setSelectedSection] = useState<AccordionSection | null>(null);
  const theme = useMantineTheme();

  // Fetch sections from the backend
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
        await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/homeInfo/${selectedSection._id}`, { title, description });
        showNotification({
          title: "Actualizado",
          message: "Sección actualizada correctamente",
          color: "green",
        });
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/homeInfo`, { title, description });
        showNotification({
          title: "Creado",
          message: "Sección creada correctamente",
          color: "green",
        });
      }
      fetchSections();
      handleResetForm();
    } catch (error) {
      console.error("Error creando/actualizando sección:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al crear/actualizar la sección",
        color: "red",
      });
    }
  };

  const handleResetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedSection(null);
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
      console.error("Error eliminando sección:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al eliminar la sección",
        color: "red",
      });
    }
  };

  const handleDragEnd = async (result: any) => {
    console.log("Drag result:", result); // Debugging log
    if (!result.destination) return;

    const updatedSections = Array.from(sections);
    const [reorderedItem] = updatedSections.splice(result.source.index, 1);
    updatedSections.splice(result.destination.index, 0, reorderedItem);

    setSections(updatedSections);
  };

  return (
    <Container size="xl">
      <Title ta="center" mb="md">
        Gestión de Secciones
      </Title>
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper shadow="xs" p="md">
            <TextInput
              label="Título"
              placeholder="Título de la sección"
              value={title}
              onChange={(e) => setTitle(e.currentTarget.value)}
              required
            />
            <Textarea
              label="Descripción"
              autosize
              minRows={2}
              maxRows={5}
              placeholder="Descripción de la sección"
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              required
              mt="md"
            />
            <Group mt="md">
              <Button onClick={handleCreateOrUpdate} leftSection={<IconDeviceFloppy />}>
                Guardar
              </Button>
              <Button onClick={handleResetForm} variant="light" color="red">
                Limpiar
              </Button>
            </Group>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections-list">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {sections.map((section, index) => (
                    <Draggable key={section._id} draggableId={section._id} index={index}>
                      {(provided) => (
                        <Card
                          {...provided.draggableProps}
                          ref={provided.innerRef}
                          withBorder
                          shadow="sm"
                          radius="md"
                          style={{
                            marginBottom: "8px",
                            ...provided.draggableProps.style,
                          }}
                        >
                          <Box {...provided.dragHandleProps} style={{ cursor: 'grab' }}>
                            <Title order={4}>{section.title}</Title>
                            <p>{section.description}</p>
                          </Box>
                          <Group justify="right" mt="xs" gap="xs">
                            <Button
                              size="xs"
                              variant="subtle"
                              onClick={() => {
                                setSelectedSection(section);
                                setTitle(section.title);
                                setDescription(section.description);
                              }}
                            >
                              <IconEdit size={16} />
                            </Button>
                            <Button
                              size="xs"
                              variant="subtle"
                              color="red"
                              onClick={() => handleDelete(section._id)}
                            >
                              <IconTrash size={16} />
                            </Button>
                          </Group>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default AdminHomeSections;
