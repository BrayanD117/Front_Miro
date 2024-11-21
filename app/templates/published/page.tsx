"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Table,
  Button,
  Pagination,
  Center,
  TextInput,
  Title,
  RingProgress,
  Text,
  Tooltip,
  List,
  Group,
  Progress,
  rem,
  Stack,
} from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications"
import { IconArrowLeft, IconDownload, IconEye, IconTable, IconTableFilled, IconTableRow, IconArrowBigUpFilled, IconArrowBigDownFilled, IconArrowsTransferDown } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format } from "fecha";
import DateConfig, { dateToGMT } from "@/app/components/DateConfig";
import { DataTable } from 'mantine-datatable';
import { useRouter } from "next/navigation";
import { useRole } from "@/app/context/RoleContext";
import { useSort } from "../../hooks/useSort";

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

interface Dependency {
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
  producers: [Dependency]
  active: boolean;
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
  loaded_data: any[];
  validators: Validator[];
}

const PublishedTemplatesPage = () => {
  const { userRole, setUserRole } = useRole();
  const router = useRouter();
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<PublishedTemplate[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [opened, setOpened] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PublishedTemplate | null>(null)
  const { sortedItems: sortedTemplates, handleSort, sortConfig } = useSort<PublishedTemplate>(templates, { key: null, direction: "asc" });

  const fetchTemplates = async (page: number, search: string) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/pTemplates/dimension`,
        {
          params: { page, limit: 10, search, email: session?.user?.email },
        }
      );

      if (response.data) {
        setTemplates(response.data.templates || []);
        setTotalPages(response.data.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al obtener las plantillas",
        color: "red",
      });
      setTemplates([]);
    }
  };

  useEffect(() => {
    if (session?.user?.email) {
      fetchTemplates(page, search);
    }
  }, [page, search, session]);

  const handleDownload = async (
    publishedTemplate: PublishedTemplate,
    validators = publishedTemplate.validators
  ) => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/pTemplates/dimension/mergedData`,
        {
          params: {
            pubTem_id: publishedTemplate._id,
            email: session?.user?.email,
          },
        }
      );

      const data = response.data.data;
      console.log("Data: ", data);
      const { template } = publishedTemplate;
      console.log("Template: ", template);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(template.name);

      const headerRow = worksheet.addRow(Object.keys(data[0]));
      headerRow.eachCell((cell) => {
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

      worksheet.columns.forEach((column) => {
        column.width = 20;
      });

      // Add the data to the worksheet starting from the second row
      data.forEach((row: any) => {
        worksheet.addRow(Object.values(row));
        console.log("Row: ", row);
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
        validator.values.forEach((value: any) => {
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

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/octet-stream" });
      saveAs(blob, `${template.file_name}.xlsx`);
    } catch (error) {
      console.error("Error downloading merged data:", error);
      showNotification({
        title: "Error",
        message: "Hubo un error al descargar los datos",
        color: "red",
      });
    }
  };

  const giveReportPercentage = (pTemplate: PublishedTemplate) => {
    return (
      (pTemplate.loaded_data.length / pTemplate.producers_dep_code.length) * 100
    );
  };

  const rows = sortedTemplates.map((publishedTemplate) => {
    let progress = {
      total: publishedTemplate.template.producers.length,
      value: publishedTemplate.loaded_data.length,
      percentage:
        (publishedTemplate.loaded_data.length /
          publishedTemplate.template.producers.length) *
        100
    };

    return (
      <Table.Tr key={publishedTemplate._id}>
        <Table.Td>{publishedTemplate.period.name}</Table.Td>
        <Table.Td>{publishedTemplate.template.dimensions.map(dim => dim.name).join(', ')}</Table.Td>
        <Table.Td>{publishedTemplate.name}</Table.Td>
        <Table.Td>
          <Center>
            {dateToGMT(publishedTemplate.period.producer_end_date)}
          </Center>
        </Table.Td>
        <Table.Td>
          <Center>
            {dateToGMT(publishedTemplate.updatedAt)}
          </Center>
        </Table.Td>
        <Table.Td>
          <Center>
            <Tooltip
              label="Presiona para ver detalles"
              transitionProps={{ transition: "slide-up", duration: 300 }}
              withArrow
            >
              <Stack
                gap={0} style={{ cursor: "pointer" }}
                onClick={()=>router.push(`/templates/uploaded/${publishedTemplate._id}?resume=true`)}
              >
                <Progress.Root
                  mt={"xs"}
                  size={"md"}
                  radius={"md"}
                  w={rem(200)}
                >
                  <Progress.Section
                  value={progress.percentage}
                  />
                </Progress.Root>
                <Text size="sm" ta={"center"} mt={rem(5)}>
                  {progress.value} de{" "}
                  {progress.total}
                </Text>
              </Stack>
            </Tooltip>
          </Center>
        </Table.Td>
        <Table.Td>
          <Center>
            <Group gap={'xs'}>
              <Tooltip
                label="Ver información enviada"
                transitionProps={{ transition: "slide-up", duration: 300 }}
                withArrow
              >
                <Button
                  variant="outline"
                  onClick={() => {
                    router.push(`/templates/uploaded/${publishedTemplate._id}?resume=false`);
                  }}
                  disabled={publishedTemplate.loaded_data.length === 0}
                >
                  <IconTableRow size={18} />
                </Button>
              </Tooltip>
              <Tooltip
                label="Descargar información enviada"
                transitionProps={{ transition: "slide-up", duration: 300 }}
                withArrow
              >
                <Button
                  variant="outline"
                  onClick={() => handleDownload(publishedTemplate)}
                  disabled={publishedTemplate.loaded_data.length === 0}
                >
                  <IconDownload size={18} />
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
        Gestión de Plantillas
      </Title>
      <TextInput
        placeholder="Buscar plantillas"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <Group>
        {
          userRole === "Administrador" && ( 
            <Button
              onClick={() =>
                router.push("/admin/templates/")
              }
              variant="outline"
              leftSection={<IconArrowLeft size={16} />}
            >
              Ir a Gestión de Plantillas
            </Button>
          )
        }
      </Group>
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
            <Table.Th onClick={() => handleSort("period.producer_end_date")} style={{ cursor: "pointer" }}>
              <Center inline>
                Plazo Máximo
                {sortConfig.key === "period.producer_end_date" ? (
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
            <Table.Th onClick={() => handleSort("updatedAt")} style={{ cursor: "pointer" }}>
              <Center inline>
                Última Modificación
                {sortConfig.key === "updatedAt" ? (
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
              <Center>Progreso</Center>
            </Table.Th>
            <Table.Th>
              <Center>Acciones</Center>
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
    </Container>
  );
};

export default PublishedTemplatesPage;
