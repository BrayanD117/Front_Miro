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
} from "@mantine/core";
import axios from "axios";
import { showNotification } from "@mantine/notifications";
import { IconArrowLeft, IconDownload } from "@tabler/icons-react";
import { useSession } from "next-auth/react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format } from "fecha";
import DateConfig from "@/app/components/DateConfig";
import { useRouter } from "next/navigation";
import { useRole } from "@/app/context/RoleContext";

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

  const rows = templates.map((publishedTemplate) => {
    let progress = {
      value:
        (publishedTemplate.loaded_data.length /
          publishedTemplate.producers_dep_code.length) *
        100,
      color: "cyan",
      tooltip: (
        <List size="sm">
          Ya cargaron:
          {publishedTemplate.loaded_data.map((data) => {
            return (
              <List.Item key={data.dependency}>{data.dependency}</List.Item>
            );
          })}
        </List>
      ),
    };

    let missing = {
      value: 100 - progress.value,
      color: "gray",
      tooltip: (
        <List size="sm">
          Pendientes:
          {publishedTemplate.producers_dep_code.map((dep) => {
            if (
              !publishedTemplate.loaded_data.find(
                (data) => data.dependency === dep
              )
            ) {
              return <List.Item key={dep}>{dep}</List.Item>;
            }
          })}
        </List>
      ),
    };

    return (
      <Table.Tr key={publishedTemplate._id}>
        <Table.Td>{publishedTemplate.period.name}</Table.Td>
        <Table.Td>{publishedTemplate.template.dimension.name}</Table.Td>
        <Table.Td>{publishedTemplate.name}</Table.Td>
        <Table.Td>
          {format(
            new Date(publishedTemplate.period.producer_end_date),
            "MMMM D, YYYY"
          )}
        </Table.Td>
        <Table.Td>
          {format(new Date(publishedTemplate.updatedAt), "MMMM D, YYYY")}
        </Table.Td>
        <Table.Td>
          <Center>
            <Button
              variant="outline"
              onClick={() => {
                router.push(`/templates/uploaded/${publishedTemplate._id}`);
              }}
              disabled={publishedTemplate.loaded_data.length === 0}
            >
              Ver Información
            </Button>
          </Center>
        </Table.Td>
        <Table.Td>
          <Center>
            {/* <Progress.Root
              mt={"xs"}
              size={"md"}
              radius={"md"}
              w={rem(200)}
              onClick={() => {
                setSelectedTemplate(pubReport);
                setOpened(true);
              }}
              style={{ cursor: "pointer" }}
            >
              <Progress.Section
                value={giveReportPercentage(pubReport)}
                striped
                animated
              />
            </Progress.Root> */}
            <RingProgress
              size={35}
              thickness={6}
              sections={[missing, progress]}
            />
          </Center>
        </Table.Td>
        <Table.Td>
          <Center>
            <Button
              variant="outline"
              onClick={() => handleDownload(publishedTemplate)}
              disabled={publishedTemplate.loaded_data.length === 0}
            >
              <IconDownload size={16} />
            </Button>
          </Center>
        </Table.Td>
      </Table.Tr>
    );
  });

  return (
    <Container size="xl">
      <DateConfig />
      <Title ta="center" mb={"md"}>
        Proceso de Cargue de Plantillas
      </Title>
      <TextInput
        placeholder="Buscar plantillas"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <Group>
        <Button
          onClick={() =>
            userRole === "Administrador"
              ? router.push("/admin/templates/")
              : router.push("/responsible/templates/")
          }
          variant="outline"
          leftSection={<IconArrowLeft size={16} />}
        >
          Ir a Gestión de Plantillas
        </Button>
      </Group>
      <Table striped withTableBorder mt="md">
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Periodo</Table.Th>
            <Table.Th>Dimensión</Table.Th>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Fecha Fin Productor</Table.Th>
            <Table.Th>Última Modificación</Table.Th>
            <Table.Th>
              <Center>Ver informacion Cargada</Center>
            </Table.Th>
            <Table.Th>
              <Center>Progreso</Center>
            </Table.Th>
            <Table.Th>
              <Center>Descargar</Center>
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
