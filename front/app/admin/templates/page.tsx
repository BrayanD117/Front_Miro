"use client";

import { useEffect, useState } from "react";
import { Container, Table, Button, Pagination, Center, TextInput, Group } from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { IconEdit, IconTrash, IconDownload } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import ExcelJS from "exceljs";
import { saveAs } from 'file-saver';

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
  file_name: string;
  file_description: string;
  fields: Field[];
  active: boolean;
}

const AdminTemplatesPage = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const fetchTemplates = async (page: number, search: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/templates/all`, {
        params: { page, limit: 10, search },
      });
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

  const handleDownload = async (template: Template) => {
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

      // Agregar comentarios
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

    // Añadir validaciones en función del datatype
    template.fields.forEach((field, index) => {
      const columnLetter = String.fromCharCode(65 + index); // Convertir índice a letra de columna (A, B, C, ...)
      const maxRows = 1000; // Número máximo de filas a validar
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
              formulae: [255],
              showErrorMessage: true,
              errorTitle: 'Valor no válido',
              error: 'Por favor, introduce un texto de hasta 255 caracteres.'
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

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, `${template.file_name}.xlsx`);
  };

  const rows = templates.map((template) => (
    <Table.Tr key={template._id}>
      <Table.Td>{template.name}</Table.Td>
      <Table.Td>{template.file_name}</Table.Td>
      <Table.Td>{template.file_description}</Table.Td>
      <Table.Td>{template.active ? "Activo" : "Inactivo"}</Table.Td>
      <Table.Td>
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
        <Button onClick={() => router.push('/templates/create')}>
          Crear Nueva Plantilla
        </Button>
      </Group>
      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Nombre del Archivo</Table.Th>
            <Table.Th>Descripción del Archivo</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th>Acciones</Table.Th>
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
    </Container>
  );
};

export default AdminTemplatesPage;
