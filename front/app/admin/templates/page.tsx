"use client";

import { useEffect, useState, FormEvent } from "react";
import { Container, Table, Button, Pagination, Center, TextInput, Group, Modal, Select, MultiSelect } from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { IconEdit, IconTrash, IconDownload, IconUser, IconArrowRight } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ExcelJS from "exceljs";
import { saveAs } from 'file-saver';
import { useDisclosure } from '@mantine/hooks';

interface Field {
  name: string;
  datatype: string;
  required: boolean;
  validate_with?: string;
  comment?: string;
}

interface Validator { 
  name: string;
  values: any[];
}

interface Template {
  _id: string;
  name: string;
  file_name: string;
  file_description: string;
  fields: Field[];
  active: boolean;
  dimension_id: string;
  created_by: {
    email: string;
    full_name: string;
  };
  validators: Validator[]
}

interface Period {
  _id: string;
  name: string;
}

interface Producer {
  dep_code: string;
  name: string;
}

const AdminTemplatesPage = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [modalOpen, { open, close }] = useDisclosure(false);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [producers, setProducers] = useState<Producer[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [selectedProducers, setSelectedProducers] = useState<string[]>([]);
  const [publicationName, setPublicationName] = useState<string>('');

  const fetchTemplates = async (page: number, search: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/templates/all`, {
        params: { page, limit: 10, search },
      });
      console.log(response);
      if (response.data) {
        setTemplates(response.data.templates || []);
        setTotalPages(response.data.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      setTemplates([]);
    }
  };

  useEffect(() => {
    fetchTemplates(page, search);
  }, [page]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTemplates(page, search);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const email = session?.user?.email;
        const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/pTemplates/feedOptions`, {
          params: { email },
        });
        setPeriods(data.periods);
        setProducers(data.producers);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    if (modalOpen && selectedTemplate) {
      fetchData();
    }
  }, [modalOpen, session, selectedTemplate]);

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/templates/delete`, { data: { id } });
      showNotification({
        title: "Eliminado",
        message: "Plantilla eliminada exitosamente",
        color: "teal",
      });
      fetchTemplates(page, search);
    } catch (error) {
      console.error("Error eliminando plantilla:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al eliminar la plantilla",
        color: "red",
      });
    }
  };

  const handleDownload = async (template: Template, validators = template.validators) => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(template.name);

    const headerRow = worksheet.addRow(template.fields.map(field => field.name));
    headerRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0f1f39' },
      };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };

      const field = template.fields[colNumber - 1];
      if (field.comment) {
        cell.note = {
          texts: [
            { font: { size: 12, color: { argb: 'FF0000' } }, text: field.comment }
          ],
          editAs: 'oneCells',
        };
      }
    });

    worksheet.columns.forEach(column => {
      column.width = 20;
    });

    template.fields.forEach((field, index) => {
      const columnLetter = String.fromCharCode(65 + index);
      const maxRows = 1000;
      for (let i = 2; i <= maxRows; i++) {
        const cellAddress = `${columnLetter}${i}`;
        const cell = worksheet.getCell(cellAddress);
        switch (field.datatype) {
          case 'Entero':
            cell.dataValidation = {
              type: 'whole',
              operator: 'between',
              formulae: [1, 9999999999999999999999999999999],
              showErrorMessage: true,
              errorTitle: 'Valor no válido',
              error: 'Por favor, introduce un número entero.'
            };
            break;
          case 'Decimal':
            cell.dataValidation = {
              type: 'decimal',
              operator: 'between',
              formulae: [0.0, 9999999999999999999999999999999],
              showErrorMessage: true,
              errorTitle: 'Valor no válido',
              error: 'Por favor, introduce un número decimal.'
            };
            break;
          case 'Porcentaje':
            cell.dataValidation = {
              type: 'decimal',
              operator: 'between',
              formulae: [0.0, 100.0],
              showErrorMessage: true,
              errorTitle: 'Valor no válido',
              error: 'Por favor, introduce un número decimal entre 0.0 y 100.0.'
            };
            break;
          case 'Texto Corto':
            cell.dataValidation = {
              type: 'textLength',
              operator: 'lessThanOrEqual',
              formulae: [60],
              showErrorMessage: true,
              errorTitle: 'Valor no válido',
              error: 'Por favor, introduce un texto de hasta 60 caracteres.'
            };
            break;
          case 'Texto Largo':
            cell.dataValidation = {
              type: 'textLength',
              operator: 'lessThanOrEqual',
              formulae: [500],
              showErrorMessage: true,
              errorTitle: 'Valor no válido',
              error: 'Por favor, introduce un texto de hasta 500 caracteres.'
            };
            break;
          case 'True/False':
            cell.dataValidation = {
              type: 'list',
              allowBlank: true,
              formulae: ['"Si,No"'],
              showErrorMessage: true,
              errorTitle: 'Valor no válido',
              error: 'Por favor, selecciona Si o No.'
            };
            break;
          case 'Fecha':
          case 'Fecha Inicial / Fecha Final':
            cell.dataValidation = {
              type: 'date',
              operator: 'between',
              formulae: [new Date(1900, 0, 1), new Date(9999, 11, 31)],
              showErrorMessage: true,
              errorTitle: 'Valor no válido',
              error: 'Por favor, introduce una fecha válida en el formato DD/MM/AAAA.'
            };
            cell.numFmt = 'DD/MM/YYYY';
            break;
          case 'Link':
            cell.dataValidation = {
              type: 'textLength',
              operator: 'greaterThan',
              formulae: [0],
              showErrorMessage: true,
              errorTitle: 'Valor no válido',
              error: 'Por favor, introduce un enlace válido.'
            };
            break;
          default:
            break;
        }
      }
    });

     // Crear una hoja por cada validador en el array
     validators.forEach(validator => {
      const validatorSheet = workbook.addWorksheet(validator.name);
  
      // Agregar encabezados basados en las claves del primer objeto de "values"
      const header = Object.keys(validator.values[0]);
      const validatorHeaderRow = validatorSheet.addRow(header);
  
      // Estilizar la fila de encabezado
      validatorHeaderRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '0f1f39' },
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });
  
      // Agregar las filas con los valores
      validator.values.forEach((value: any) => {
        const row = validatorSheet.addRow(Object.values(value));
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });
  
      // Ajustar el ancho de las columnas
      validatorSheet.columns.forEach(column => {
        column.width = 20;
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, `${template.file_name}.xlsx`);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/pTemplates/publish`, {
        name: publicationName,
        template_id: selectedTemplate?._id,
        period_id: selectedPeriod,
        producers_dep_code: selectedProducers,
        dimension_id: selectedTemplate?.dimension_id,
        user_email: session?.user?.email,
      });
      console.log('Template successfully published');
      showNotification({
        title: "Publicación Exitosa",
        message: "La plantilla ha sido publicada exitosamente",
        color: "teal",
      });
      close();
    } catch (error) {
      console.error('Error publishing template:', error);
      showNotification({
        title: "Error",
        message: "Hubo un error al publicar la plantilla",
        color: "red",
      });
    }
  };

  const rows = templates.map((template) => (
    <Table.Tr key={template._id}>
      <Table.Td>{template.name}</Table.Td>
      <Table.Td>{template.created_by.full_name}</Table.Td>
      <Table.Td>{template.file_description}</Table.Td>
      <Table.Td>{template.active ? "Activo" : "Inactivo"}</Table.Td>
      <Table.Td>
        <Center>
          <Group gap={5}>
            <Button
              variant="outline"
              onClick={() => router.push(`/templates/update/${template._id}`)}
            >
              <IconEdit size={16} />
            </Button>
            <Button color="red" variant="outline" onClick={() => handleDelete(template._id)}>
              <IconTrash size={16} />
            </Button>
            <Button variant="outline" onClick={() => handleDownload(template)}>
              <IconDownload size={16} />
            </Button>
          </Group>
        </Center>
      </Table.Td>
      <Table.Td>
        <Center>
          <Button variant="outline" onClick={() => { 
            setSelectedTemplate(template); 
            open(); 
            console.log("Modal open state:", modalOpen);
          }}>
            <IconUser size={16} />
          </Button>
        </Center>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl">
      <TextInput
        placeholder="Buscar en todas las plantillas"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <Group>
        <Button variant="outline" onClick={() => router.push('/templates/create')}>
          Crear Nueva Plantilla
        </Button>
        <Button 
          ml={"auto"} 
          onClick={() => router.push('/templates/published')}
          variant="outline"
          rightSection={<IconArrowRight size={16} />}>
          Ir a Plantillas Publicadas
        </Button>
      </Group>
      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Creado Por</Table.Th>
            <Table.Th>Descripción del Archivo</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th><Center>Acciones</Center></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
      <Center>
        <Pagination
          mt={15}
          value={page}
          onChange={setPage}
          total={totalPages}
          siblings={1}
          boundaries={3}
        />
      </Center>
      <Modal
        opened={modalOpen}
        onClose={close}
        title="Asignar Plantilla"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <form onSubmit={handleSubmit}>
          <TextInput label="Nombre de la Publicación" placeholder="Ingrese el nombre de la publicación" value={publicationName} onChange={(e) => setPublicationName(e.currentTarget.value)} />
          <TextInput label="Nombre de la Plantilla" value={selectedTemplate?.name || ''} disabled />
          <Select
            label="Período"
            placeholder="Seleccione un período"
            data={periods.map(period => ({ value: period._id, label: period.name }))}
            value={selectedPeriod}
            onChange={(value) => setSelectedPeriod(value || '')}
          />
          <MultiSelect
            label="Productores"
            placeholder="Seleccione productores"
            data={producers.map(producer => ({ value: producer.dep_code, label: producer.name }))}
            value={selectedProducers}
            onChange={setSelectedProducers}
          />
          <Group justify="flex-end" mt="md">
            <Button type="submit">Asignar</Button>
          </Group>
        </form>
      </Modal>
    </Container>
  );
};

export default AdminTemplatesPage;
