"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Table,
  Button,
  Pagination,
  Center,
  TextInput,
  Modal,
  Title,
  Group,
  Tooltip,
} from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import {
  IconArrowBigDownFilled,
  IconArrowBigUpFilled,
  IconArrowRight,
  IconArrowsTransferDown,
  IconDownload,
  IconEdit,
  IconPencil,
  IconUpload,
} from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useDisclosure } from "@mantine/hooks";
import { format } from "fecha";
import DateConfig, { dateNow, dateToGMT } from "@/app/components/DateConfig";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useSort } from "../../hooks/useSort";
import ProducerUploadedTemplatesPage from "./uploaded/ProducerUploadedTemplates";

const DropzoneButton = dynamic(
  () =>
    import("@/app/components/Dropzone/DropzoneButton").then(
      (mod) => mod.DropzoneButton
    ),
  { ssr: false }
);

interface Field {
  name: string;
  datatype: string;
  required: boolean;
  validate_with?: string;
  comment?: string;
}

interface Dimension {
  _id: string;
  name: string;
}

interface Template {
  _id: string;
  name: string;
  file_name: string;
  dimensions: [Dimension];
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

interface Period {
  name: string;
  producer_end_date: Date;
}

interface PublishedTemplate {
  _id: string;
  name: string;
  published_by: any;
  template: Template;
  period: Period;
  producers_dep_code: string[];
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  loaded_data: ProducerData[];
  validators: Validator[];
  deadline: Date;
}

const ProducerTemplatesPage = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<PublishedTemplate[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [producerEndDate, setProducerEndDate] = useState<Date | undefined>();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [uploadModalOpen, { open: openUploadModal, close: closeUploadModal }] =
    useDisclosure(false);
  const { sortedItems: sortedTemplates, handleSort, sortConfig } = useSort<PublishedTemplate>(templates, { key: null, direction: "asc" });

  const fetchTemplates = async (page: number, search: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/pTemplates/available`,
        {
          params: { email: session?.user?.email, page, limit: 10, search },
        }
      );
      if (response.data) {
        setTemplates(response.data.templates || []);
        setTotalPages(response.data.pages || 1);
        setProducerEndDate(response.data.templates[0].deadline);
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

    const headerRow = worksheet.addRow(
      template.fields.map((field) => field.name)
    );
    headerRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, color: { argb: "FFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0f1f39" },
      };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };

      const field = template.fields[colNumber - 1];
      if (field.comment) {
        cell.note = {
          texts: [
            {
              font: { size: 12, color: { argb: "FF0000" } },
              text: field.comment,
            },
          ],
          editAs: "oneCells",
        };
      }
    });

    worksheet.columns.forEach((column) => {
      column.width = 20;
    });

    // Crear una hoja por cada validador en el array
    validators.forEach((validator) => {
      const validatorSheet = workbook.addWorksheet(validator.name);

      // Agregar encabezados basados en las claves del primer objeto de "values"
      const header = Object.keys(validator.values[0]);
      const validatorHeaderRow = validatorSheet.addRow(header);

      // Estilizar la fila de encabezado
      validatorHeaderRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFF" } };
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "0f1f39" },
        };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = { vertical: "middle", horizontal: "center" };
      });

      // Agregar las filas con los valores
      validator.values.forEach((value) => {
        const row = validatorSheet.addRow(Object.values(value));
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // Ajustar el ancho de las columnas
      validatorSheet.columns.forEach((column) => {
        column.width = 20;
      });
    });

    // Generar y descargar el archivo Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/octet-stream" });
    saveAs(blob, `${template.file_name}.xlsx`);
  };

  const handleUploadClick = (publishedTemplate: PublishedTemplate) => {
    if(handleDisableUpload(publishedTemplate)) {
      showNotification({
        title: "Error",
        message: "El periodo ya se encuentra cerrado",
        color: "red",
      })
      return;
    }
    setSelectedTemplateId(publishedTemplate._id);
    openUploadModal();
  };

  const handleDisableUpload = (publishedTemplate: PublishedTemplate) => {
    return (
      new Date(dateNow().toDateString()) >
      new Date(publishedTemplate.deadline)
    );
  };

  const rows = sortedTemplates.map((publishedTemplate) => {
    const uploadDisable = handleDisableUpload(publishedTemplate);
    return (
      <Table.Tr key={publishedTemplate._id}>
        <Table.Td>{publishedTemplate.period.name}</Table.Td>
        <Table.Td>{publishedTemplate.name}</Table.Td>
        <Table.Td>{publishedTemplate.template.dimensions.map(dim => dim.name).join(', ')}</Table.Td>
        <Table.Td fw={700}>
          {dateToGMT(publishedTemplate.deadline ?? publishedTemplate.period.producer_end_date)}
        </Table.Td>
        <Table.Td>
          <Center>
            <Tooltip
              label="Descargar plantilla"
              transitionProps={{ transition: "fade-up", duration: 300 }}
            >
              <Button
                variant="outline"
                onClick={() => handleDownload(publishedTemplate)}
              >
                <IconDownload size={16} />
              </Button>
            </Tooltip>
          </Center>
        </Table.Td>
        <Table.Td>
          <Center>
            <Group>
              <Tooltip
                label={
                  uploadDisable
                    ? "El periodo ya se encuentra cerrado"
                    : "Cargar plantilla (Hoja de cálculo)"
                }
                transitionProps={{ transition: "fade-up", duration: 300 }}
              >
                <Button
                  variant="outline"
                  color="green"
                  onClick={() => handleUploadClick(publishedTemplate)}
                  disabled={uploadDisable}
                >
                  <IconUpload size={16} />
                </Button>
              </Tooltip>
              <Tooltip
                label={
                  uploadDisable
                    ? "El periodo ya se encuentra cerrado"
                    : "Edición en línea"
                }
                transitionProps={{ transition: "fade-up", duration: 300 }}
              >
                <Button
                  variant="outline"
                  color="green"
                  onClick={() =>
                    router.push(
                      `/producer/templates/form/${publishedTemplate._id}`
                    )
                  }
                  disabled={uploadDisable}
                >
                  <IconPencil size={16} />
                </Button>
              </Tooltip>
            </Group>
          </Center>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Container size="xl">
      <DateConfig />
      <Title ta="center" mb={"md"}>
        Plantillas Pendientes
      </Title>
      <TextInput
        placeholder="Buscar plantillas  "
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
          <Table.Th onClick={() => handleSort("period.name")} style={{ cursor: "pointer" }}>
              <Center inline>
                Periodo
                {sortConfig.key === "period.name" ? (
                  sortConfig.direction === "asc" ? (
                    <IconArrowBigUpFilled size={16} style={{ marginLeft: "5px" }} />
                  ) : (
                    <IconArrowBigDownFilled size={16} style={{ marginLeft: "5px" }} />
                  )
                ) : (
                  <IconArrowsTransferDown size={16} style={{ marginLeft: "5px" }} />
                )}
              </Center>
            </Table.Th>
            <Table.Th onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
              <Center inline>
                Nombre
                {sortConfig.key === "name" ? (
                  sortConfig.direction === "asc" ? (
                    <IconArrowBigUpFilled size={16} style={{ marginLeft: "5px" }} />
                  ) : (
                    <IconArrowBigDownFilled size={16} style={{ marginLeft: "5px" }} />
                  )
                ) : (
                  <IconArrowsTransferDown size={16} style={{ marginLeft: "5px" }} />
                )}
              </Center>
            </Table.Th>
            <Table.Th onClick={() => handleSort("template.dimension.name")} style={{ cursor: "pointer" }}>
              <Center inline>
                Dimensión
                {sortConfig.key === "template.dimension.name" ? (
                  sortConfig.direction === "asc" ? (
                    <IconArrowBigUpFilled size={16} style={{ marginLeft: "5px" }} />
                  ) : (
                    <IconArrowBigDownFilled size={16} style={{ marginLeft: "5px" }} />
                  )
                ) : (
                  <IconArrowsTransferDown size={16} style={{ marginLeft: "5px" }} />
                )}
              </Center>
            </Table.Th>
            <Table.Th>
              <Center inline>
                Fecha Límite
              </Center>
            </Table.Th>
            <Table.Th>
              <Center>Descargar</Center>
            </Table.Th>
            <Table.Th>
              <Center>Subir Información</Center>
            </Table.Th>
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
            endDate={producerEndDate}
            onClose={closeUploadModal}
            onUploadSuccess={refreshTemplates}
          />
        )}
      </Modal>
      <ProducerUploadedTemplatesPage></ProducerUploadedTemplatesPage>
    </Container>
  );
};

export default ProducerTemplatesPage;
