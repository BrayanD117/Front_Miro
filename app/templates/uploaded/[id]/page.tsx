"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { Container, Table, Title, Text, ScrollArea, Center, Tooltip, Button, Group } from "@mantine/core";
import { useSession } from "next-auth/react";
import { IconCheck, IconX, IconArrowLeft } from "@tabler/icons-react";
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import DateConfig, { dateToGMT } from "@/app/components/DateConfig";

interface RowData {
  [key: string]: any;
}

const UploadedTemplatePage = () => {
  const router = useRouter();
  const { id } = useParams();
  const [tableData, setTableData] = useState<RowData[]>([]);
  const [templateName, setTemplateName] = useState("");
  const { data: session } = useSession();

  const fetchDependenciesNames = async (depCodes: string[]) => {
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/dependencies/names`, {
        codes: depCodes,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching dependency names:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchTemplateName = async () => {
      try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/pTemplates/template/${id}`);
        const templateName = response.data.name || "Plantilla sin nombre";
        setTemplateName(templateName);
      } catch (error) {
        console.error("Error fetching template name:", error);
      }
    };

    const fetchUploadedData = async () => {
      if (id && session?.user?.email) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/pTemplates/dimension/mergedData`,
            {
              params: {
                pubTem_id: id,
                email: session?.user?.email,
              },
            }
          );

          const data = response.data.data;

          if (Array.isArray(data) && data.length > 0) {
            const depCodes = data.map((row: RowData) => row.Dependencia);
            const dependencyNames = await fetchDependenciesNames(depCodes);

            const updatedData = data.map((row: RowData) => {
              const dependencyName = dependencyNames.find((dep: { code: string, name: string }) => dep.code === row.Dependencia);
              return {
                ...row,
                Dependencia: dependencyName ? dependencyName.name : row.Dependencia,
              };
            });

            setTableData(updatedData);
          } else {
            console.error("Invalid data format received from API.");
          }
        } catch (error) {
          console.error("Error fetching uploaded data:", error);
        }
      }
    };

    fetchTemplateName();
    fetchUploadedData();
  }, [id, session]);

  const renderCellContent = (value: any) => {
    if (typeof value === "boolean") {
      return value ? <IconCheck color="green" size={25} /> : <IconX color="red" size={25} />;
    } else if (typeof value === "string" && dayjs(value).isValid()) {
      return dateToGMT(value, 'YYYY/MM/DD');
    }
    return value;
  };

  return (
    <Container size={"lg"}>
      <Title ta="center">{`Datos Cargados para: ${templateName}`}</Title>
      <Group mb="md">
        <Button variant="outline" leftSection={<IconArrowLeft />} onClick={() => router.back()}>
          Ir atrás
        </Button>
      </Group>
      {tableData.length === 0 ? (
        <Text ta={"center"}>No hay datos cargados para esta plantilla.</Text>
      ) : (
        <Tooltip
          label="Desplázate horizontalmente para ver más"
          position="bottom"
          withArrow
          transitionProps={{ transition: "slide-up", duration: 300 }}
        >
          <ScrollArea>
            <Table mb={"md"} striped withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  {Object.keys(tableData[0]).map((fieldName, index) => (
                    <Table.Th key={index} style={{ minWidth: "200px" }}>
                      <Center>{fieldName}</Center>
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {tableData.map((rowData, rowIndex) => (
                  <Table.Tr key={rowIndex}>
                    {Object.keys(rowData).map((fieldName, cellIndex) => (
                      <Table.Td key={cellIndex} style={{ minWidth: "200px" }}>
                        <Center>{renderCellContent(rowData[fieldName])}</Center>
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Tooltip>
      )}
    </Container>
  );
};

export default UploadedTemplatePage;
