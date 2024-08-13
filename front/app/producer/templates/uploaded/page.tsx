"use client";

import { useEffect, useState } from "react";
import { Container, Table, Button, Pagination, Center, TextInput, Modal, Tooltip, Title } from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { IconDownload, IconEdit, IconTrash } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import ExcelJS from "exceljs";
import { saveAs } from 'file-saver';
import { DropzoneUpdateButton } from "@/app/components/DropzoneUpdate/DropzoneUpdateButton";
import { useDisclosure } from '@mantine/hooks';
import { format } from 'fecha';
import DateConfig from "@/app/components/DateConfig";

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
  dimension: any;
  file_description: string;
  fields: Field[];
  active: boolean;
}

interface FilledFieldData {
  field_name: string;
  values: any[];
}

interface ProducerData {
  dependency: string;
  send_by: any;
  loaded_date: Date;
  filled_data: FilledFieldData[];
}

interface PublishedTemplate {
  _id: string;
  name: string;
  published_by: any;
  template: Template;
  period: any;
  producers_dep_code: string[];
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  loaded_data: ProducerData[];
}

const ProducerUploadedTemplatesPage = () => {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<PublishedTemplate[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [uploadModalOpen, { open: openUploadModal, close: closeUploadModal }] = useDisclosure(false);

  const fetchTemplates = async (page: number, search: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/pTemplates/uploaded`, {
        params: { email: session?.user?.email, page, limit: 10, search },
      });
      if (response.data) {
        setTemplates(response.data.templates || []);
        setTotalPages(response.data.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching uploaded templates:", error);
      setTemplates([]);
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetchTemplates(page, search);
    }
  }, [page, session]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (session?.user?.email) {
        fetchTemplates(page, search);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleDownload = async (publishedTemplate: PublishedTemplate) => {
    const { template } = publishedTemplate;
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

    const filledData = publishedTemplate.loaded_data.find(
      (data: any) => data.send_by?.email === session?.user?.email
    );

    if (filledData) {
      const numRows = filledData.filled_data[0].values.length;
      for (let i = 0; i < numRows; i++) {
        const rowValues = template.fields.map(field => {
          const fieldData = filledData.filled_data.find((data: FilledFieldData) => data.field_name === field.name);
          return fieldData ? fieldData.values[i] : null;
        });
        worksheet.addRow(rowValues);
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, `${template.file_name}.xlsx`);
  };

  const handleEditClick = (publishedTemplateId: string) => {
    setSelectedTemplateId(publishedTemplateId);
    openUploadModal();
  };

  const handleDeleteClick = async (publishedTemplateId: string) => {
    try {
      const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/pTemplates/producer/delete`, {
        params: { pubTem_id: publishedTemplateId, email: session?.user?.email },
      });
      if (response.data) {
        showNotification({
          title: "Información eliminada",
          message: "La información ha sido eliminada exitosamente",
          color: "blue",
        });
        fetchTemplates(page, search);
      }
    } catch (error) {
      console.error("Error deleting template:", error);
      showNotification({
        title: "Error",
        message: "Ocurrió un error al eliminar la información",
        color: "red",
      });
    }
  };

  const truncateString = (str: string, maxLength: number = 20): string => {
    return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
  }

  const rows = templates.map((publishedTemplate) => {
    return (
      <Table.Tr key={publishedTemplate._id}>
        <Table.Td>{publishedTemplate.period.name}</Table.Td>
        <Table.Td>{publishedTemplate.name}</Table.Td>
        <Table.Td>{publishedTemplate.template.dimension.name}</Table.Td>
        <Table.Td>{format(new Date(publishedTemplate.period.producer_end_date), 'MMMM D, YYYY')}</Table.Td>
        <Table.Td>{truncateString(publishedTemplate.loaded_data[0].send_by.full_name)}</Table.Td>
        <Table.Td>{format(new Date(publishedTemplate.loaded_data[0].loaded_date), 'MMMM D, YYYY')}</Table.Td>
        <Table.Td>
          <Center>
            <Button variant="outline" onClick={() => handleDownload(publishedTemplate)}>
              <IconDownload size={16} />
            </Button>
          </Center>
        </Table.Td>
        <Table.Td>
          <Center>
            <Tooltip label="Editar esta plantilla" position="top" withArrow>
              <div>
                <Button
                  variant="outline"
                  color="blue"
                  onClick={() => handleEditClick(publishedTemplate._id)}
                >
                  <IconEdit size={16} />
                </Button>
              </div>
            </Tooltip>
          </Center>
        </Table.Td>
        <Table.Td>
          <Center>
            <Button variant="outline" color="red" onClick={() => handleDeleteClick(publishedTemplate._id)}>
              <IconTrash size={16} />
            </Button>
          </Center>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Container size="xl">
      <DateConfig />
      <Title ta="center" mb={"md"}>Plantillas Cargadas</Title>
      <TextInput
        placeholder="Buscar plantillas"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Periodo</Table.Th>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Dimensión</Table.Th>
            <Table.Th>Fecha Fin Productor</Table.Th>
            <Table.Th>Cargado por</Table.Th>
            <Table.Th>Fecha de Cargue</Table.Th>
            <Table.Th><Center>Descargar</Center></Table.Th>
            <Table.Th><Center>Corregir Información</Center></Table.Th>
            <Table.Th><Center>Eliminar Información</Center></Table.Th>
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
        opened={uploadModalOpen}
        onClose={() => {closeUploadModal(); fetchTemplates(page, search);}}
        title="Editar Información"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        size="50%"
        centered
      >
        {selectedTemplateId && <DropzoneUpdateButton pubTemId={selectedTemplateId} onClose={closeUploadModal} edit />}
      </Modal>
    </Container>
  );
};

export default ProducerUploadedTemplatesPage;
