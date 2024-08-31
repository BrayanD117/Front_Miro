"use client";

import { useEffect, useState } from "react";
import { Container, Table, Button, Pagination, Center, TextInput, Modal, Title, Group } from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { IconArrowRight, IconDownload, IconUpload } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import ExcelJS from "exceljs";
import { saveAs } from 'file-saver';
import { useDisclosure } from '@mantine/hooks';
import { format } from 'fecha';
import DateConfig from "@/app/components/DateConfig";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';

const DropzoneButton = dynamic(() => import('@/app/components/Dropzone/DropzoneButton').then((mod) => mod.DropzoneButton), { ssr: false });

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

interface Validator { 
  name: string;
  values: any[];
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
  validators: Validator[];
}

const ProducerTemplatesPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<PublishedTemplate[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [uploadModalOpen, { open: openUploadModal, close: closeUploadModal }] = useDisclosure(false);

  const fetchTemplates = async (page: number, search: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/pTemplates/available`, {
        params: { email: session?.user?.email, page, limit: 10, search },
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

  const refreshTemplates = () => {
    if (session?.user?.email) {
      fetchTemplates(page, search);
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
    const { template, validators } = publishedTemplate;
    const workbook = new ExcelJS.Workbook();
    
    // Crear la hoja principal basada en el template
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
      validator.values.forEach(value => {
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
  
    // Generar y descargar el archivo Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, `${template.file_name}.xlsx`);
  };

  const handleUploadClick = (publishedTemplateId: string) => {
    setSelectedTemplateId(publishedTemplateId);
    openUploadModal();
  };

  const rows = templates.map((publishedTemplate) => {
    return (
      <Table.Tr key={publishedTemplate._id}>
        <Table.Td>{publishedTemplate.period.name}</Table.Td>
        <Table.Td>{publishedTemplate.name}</Table.Td>
        <Table.Td>{publishedTemplate.template.dimension.name}</Table.Td>
        <Table.Td>{format(new Date(publishedTemplate.period.producer_end_date), 'MMMM D, YYYY')}</Table.Td>
        <Table.Td>
          <Center>
            <Button variant="outline" onClick={() => handleDownload(publishedTemplate)}>
              <IconDownload size={16} />
            </Button>
          </Center>
        </Table.Td>
        <Table.Td>
          <Center>
            <Group>
              <Button
                variant="outline"
                color="green"
                onClick={() => handleUploadClick(publishedTemplate._id)}
              >
                <IconUpload size={16} />
              </Button>
              <Button
                variant="outline"
                color="blue"
                onClick={() => router.push(`/producer/templates/form/${publishedTemplate._id}`)}
              >
                Registro Directo
              </Button>
            </Group>
          </Center>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Container size="xl">
      <DateConfig />
      <Title ta="center" mb={"md"}>Plantillas Pendientes</Title>
      <TextInput
        placeholder="Buscar plantillas"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <Group>
        <Button 
          ml={"auto"} 
          onClick={() => router.push('/producer/templates/uploaded')}
          variant="outline"
          rightSection={<IconArrowRight size={16} />}>
          Ver Plantillas Enviadas
        </Button>
      </Group>
      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Periodo</Table.Th>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Dimensión</Table.Th>
            <Table.Th>Fecha Fin Productor</Table.Th>
            <Table.Th><Center>Descargar</Center></Table.Th>
            <Table.Th><Center>Subir Información</Center></Table.Th>
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
        onClose={closeUploadModal}
        title="Subir Información"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        size="50%"
        centered
        withCloseButton={false}
      >
        {selectedTemplateId && (
          <DropzoneButton 
            pubTemId={selectedTemplateId} 
            onClose={closeUploadModal} 
            onUploadSuccess={refreshTemplates} 
          />
        )}
      </Modal>
    </Container>
  );
};

export default ProducerTemplatesPage;
