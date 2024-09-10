"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { Container, Table, Title, Text, ScrollArea, Center } from "@mantine/core";
import { useSession } from "next-auth/react";

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
            setTemplateName(`Template ID: ${id}`);
            setTableData(data);
            console.log(data)
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

  return (
    <Container>
      <Title ta="center" mb={"md"}>{`Datos Cargados para: ${templateName}`}</Title>
      {tableData.length === 0 ? (
        <Text ta={"center"}>No hay datos cargados para esta plantilla.</Text>
      ) : (
        <ScrollArea>
          <Table striped withTableBorder>
            <Table.Thead>
              <Table.Tr>
                {Object.keys(tableData[0]).map((fieldName, index) => (
                  <Table.Th key={index}><Center>{fieldName}</Center></Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {tableData.map((rowData, rowIndex) => (
                <Table.Tr key={rowIndex}>
                  {Object.keys(rowData).map((fieldName, cellIndex) => (
                    <Table.Td key={cellIndex}><Center>{rowData[fieldName]}</Center></Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </Container>
  );
};

export default UploadedTemplatePage;
