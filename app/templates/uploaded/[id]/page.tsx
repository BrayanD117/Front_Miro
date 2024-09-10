"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { Container, Table, Title, Text, ScrollArea, Center, Tooltip } from "@mantine/core";
import { useSession } from "next-auth/react";
import { IconCheck, IconX } from "@tabler/icons-react";
import dayjs from 'dayjs';
import 'dayjs/locale/es';

interface RowData {
  [key: string]: any;
}

const UploadedTemplatePage = () => {
  const { id } = useParams();
  const [tableData, setTableData] = useState<RowData[]>([]);
  const [templateName, setTemplateName] = useState("");
  const { data: session } = useSession();

  useEffect(() => {
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
            setTemplateName(`${id}`);
            setTableData(data);
            console.log(data);
          } else {
            console.error("Invalid data format received from API.");
          }
        } catch (error) {
          console.error("Error fetching uploaded data:", error);
        }
      }
    };

    fetchUploadedData();
  }, [id, session]);

  const renderCellContent = (value: any) => {
    if (typeof value === "boolean") {
      return value ? <IconCheck color="green" size={25} /> : <IconX color="red" size={25} />;
    } else if (typeof value === "string" && dayjs(value).isValid()) {
      // Formatear la fecha usando dayjs
      return dayjs(value).locale('es').format('DD/MM/YYYY');
    }
    return value;
  };

  return (
    <Container size={"lg"}>
      <Title ta="center" mb={"md"}>{`Datos Cargados para: ${templateName}`}</Title>
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
