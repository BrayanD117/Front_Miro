"use client";

import { useEffect, useState } from "react";
import { Container, Table, Button, Pagination, Center, TextInput, Modal, Tooltip, Title } from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { IconDownload, IconUpload } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import ExcelJS from "exceljs";
import { saveAs } from 'file-saver';
import { DropzoneButton } from "@/app/components/Dropzone/DropzoneButton";
import { useDisclosure } from '@mantine/hooks';
import { format, setGlobalDateI18n } from 'fecha';

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
  loaded_data: any[];
}

const ProducerTemplatesPage = () => {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<PublishedTemplate[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [uploadModalOpen, { open: openUploadModal, close: closeUploadModal }] = useDisclosure(false);

  const fetchTemplates = async (page: number, search: string) => {
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/pTemplates`, {
        params: { page, limit: 10, search, email: session?.user?.email },
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
    if (session?.user?.email) {
      fetchTemplates(page, search);
    }
  }, [page, search, session]);

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

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, `${template.file_name}.xlsx`);
  };

  const handleUploadClick = (publishedTemplateId: string) => {
    setSelectedTemplateId(publishedTemplateId);
    openUploadModal();
  };

  const spanishLocale: {
    dayNames: [string, string, string, string, string, string, string];
    dayNamesShort: [string, string, string, string, string, string, string];
    monthNames: [string, string, string, string, string, string, string, string, string, string, string, string];
    monthNamesShort: [string, string, string, string, string, string, string, string, string, string, string, string];
    amPm: [string, string];
} = {
    dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
    monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
    monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    amPm: ['AM', 'PM']
};

  setGlobalDateI18n(spanishLocale)
  
  const rows = templates.map((publishedTemplate) => {
    const userHasUploaded = publishedTemplate.loaded_data?.some(
      (data) => data.send_by.email === session?.user?.email
    );

    return (
      <Table.Tr key={publishedTemplate._id}>
        <Table.Td>{publishedTemplate.period.name}</Table.Td>
        <Table.Td>{publishedTemplate.template.name}</Table.Td>
        <Table.Td>{publishedTemplate.template.dimension.name}</Table.Td>
        <Table.Td>{format(new Date(publishedTemplate.period.collect_end_date), 'MMMM D, YYYY')}</Table.Td>
        <Table.Td>
          <Center>
            <Button variant="outline" onClick={() => handleDownload(publishedTemplate)}>
              <IconDownload size={16} />
            </Button>
          </Center>
        </Table.Td>
        <Table.Td>
          <Center>
            <Tooltip
              label="Ya enviaste esta plantilla"
              position="top"
              withArrow
              disabled={!userHasUploaded}
            >
              <div>
                <Button
                  variant="outline"
                  color="green"
                  onClick={() => handleUploadClick(publishedTemplate._id)}
                  disabled={userHasUploaded}
                >
                  <IconUpload size={16} />
                </Button>
              </div>
            </Tooltip>
          </Center>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Container size="xl">
      <Title ta="center" mb={"md"}>Plantillas disponibles</Title>
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
      >
        {selectedTemplateId && <DropzoneButton pubTemId={selectedTemplateId} />}
      </Modal>
    </Container>
  );
};

export default ProducerTemplatesPage;
