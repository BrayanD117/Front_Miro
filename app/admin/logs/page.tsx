"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Table,
  TextInput,
  Pagination,
  Button,
  Modal,
  Text,
  Title,
  ScrollArea,
  Center,
  Divider,
  Flex,
  Badge,
  List,
  ThemeIcon,
  rem,
} from "@mantine/core";
import axios from "axios";
import { IconCircleCheck, IconColumnRemove } from "@tabler/icons-react";
import { dateToGMT } from "@/app/components/DateConfig";

interface Log {
  _id: string;
  user: {
    full_name: string;
    email: string;
  };
  published_template: {
    _id: string;
    name: string;
  };
  date: Date;
  errors: ErrorItem[];
}

interface ErrorItem {
  column: string;
  description: ErrorDescription[];
}

interface ErrorDescription {
  register: number;
  value: string;
  message: string;
}

const AdminLogsPage = () => {
  const [logs, setLogs] = useState<Log[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [modalOpened, setModalOpened] = useState(false);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/logs`,
        {
          params: {
            page,
            limit: 10,
            search,
          },
        }
      );
      setLogs(response.data.logs);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error("Error al obtener los logs:", error);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, search]);

  const rows = logs.map((log) => (
    <Table.Tr key={log._id}>
      <Table.Td>{log.user.full_name}</Table.Td>
      <Table.Td>{log.published_template.name}</Table.Td>
      <Table.Td>{dateToGMT(log.date, 'MMM D, YYYY H:mm')}</Table.Td>
      <Table.Td>{log.errors.length}</Table.Td>
      <Table.Td>
        <Button
          variant="outline"
          onClick={() => {
            setSelectedLog(log);
            setModalOpened(true);
          }}
        >
          Ver detalles
        </Button>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Container size="xl">
      <Title ta={"center"} order={2} mb="md">
        Errores en el cargue de informacion (logs)
      </Title>
      <TextInput
        placeholder="Buscar logs"
        value={search}
        onChange={(event) => setSearch(event.currentTarget.value)}
        mb="md"
      />
      <ScrollArea>
        <Table striped highlightOnHover withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Usuario</Table.Th>
              <Table.Th>Plantilla</Table.Th>
              <Table.Th>Fecha</Table.Th>
              <Table.Th>Número de Errores</Table.Th>
              <Table.Th>Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>{rows}</Table.Tbody>
        </Table>
      </ScrollArea>
      <Center>
        <Pagination
          value={page}
          onChange={setPage}
          total={totalPages}
          mt="md"
        />
      </Center>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title="Detalles del Log"
        size="auto"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        {selectedLog && (
          <div>
            <Title order={3} ta={"center"} mb={5}>
              Registro de errores
            </Title>
            <Table
              striped
              withRowBorders
              withColumnBorders
              withTableBorder
              highlightOnHover
            >
              <Table.Tbody>
                <Table.Tr>
                  <Table.Th style={{ textAlign: "right" }}>Usuario:</Table.Th>
                  <Table.Td>{selectedLog.user.full_name}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Th style={{ textAlign: "right" }}>Email:</Table.Th>
                  <Table.Td>{selectedLog.user.email}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Th style={{ textAlign: "right" }}>Plantilla:</Table.Th>
                  <Table.Td>{selectedLog.published_template.name}</Table.Td>
                </Table.Tr>
                <Table.Tr>
                  <Table.Th style={{ textAlign: "right" }}>Fecha:</Table.Th>
                  <Table.Td>
                    {dayjs(selectedLog.date).format("DD/MM/YYYY HH:mm")}
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
            <Divider m={5} />
            <Center mt={15}>
              <Badge size="lg" color="red">
                Errores
              </Badge>
            </Center>
            <ScrollArea style={{ height: 250 }}>
              {selectedLog.errors.map((error, index) => (
                <div key={index} style={{ marginBottom: "1rem" }}>
                  <List
                    spacing="xs"
                    size="sm"
                    center
                    icon={
                      <ThemeIcon color="blue" size={24} radius="xl">
                        <IconColumnRemove
                          style={{ width: rem(16), height: rem(16) }}
                        />
                      </ThemeIcon>
                    }
                  >
                    <List.Item>
                      <Flex gap="xs" align="center">
                        <Text fw={700}>Columna:</Text>
                        <Text>{error.column}</Text>
                      </Flex>
                    </List.Item>
                  </List>

                  {error.description.map((desc, idx) => (
                    <div
                      key={idx}
                      style={{
                        marginLeft: "1rem",
                        marginBottom: "0.5rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      <List spacing="xs" size="sm" center>
                        <List.Item>
                          <Flex gap="xs" align="center">
                            <Text fw={700}>Registro:</Text>
                            <Text>{desc.register}</Text>
                          </Flex>
                        </List.Item>
                        <List.Item>
                          <Flex gap="xs" align="center">
                            <Text fw={700}>Valor:</Text>
                            <Text>{desc.value}</Text>
                          </Flex>
                        </List.Item>
                        <List.Item>
                          <Flex gap="xs" align="center">
                            <Text fw={700}>Mensaje:</Text>
                            <Text>{desc.message}</Text>
                          </Flex>
                        </List.Item>
                      </List>
                    </div>
                  ))}
                  <Divider />
                </div>
              ))}
            </ScrollArea>
          </div>
        )}
      </Modal>
    </Container>
  );
};

export default AdminLogsPage;
