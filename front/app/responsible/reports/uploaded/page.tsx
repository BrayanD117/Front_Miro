"use client";

import {use, useEffect, useState} from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Accordion, Badge, Button, Center, Container, Divider, FileInput, Group, Modal, Pagination, Pill, PillGroup, rem, Table, Text, TextInput, Title, Tooltip, useMantineTheme } from '@mantine/core';
import { IconArrowLeft, IconArrowRight, IconCloudUpload, IconDownload, IconEdit, IconFileDescription, IconTrash, IconUpload, IconX } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import DateConfig from '@/app/components/DateConfig';
import classes from '../ResponsibleReportsPage.module.css';
import { format } from 'fecha';
import { showNotification } from '@mantine/notifications';
import { Dropzone } from '@mantine/dropzone';
import uploadAnimation from "../../../../public/lottie/upload.json";
import successAnimation from "../../../../public/lottie/success.json";
import Lottie from "lottie-react";

interface Report {
    _id: string;
  name: string;
  description: string;
  report_example_id: string;
  report_example_link: string;
  report_example_download: string;
  requires_attachment: boolean;
  file_name: string;
  created_by: {
    email: string;
    full_name: string;
  };
}

interface Dimension {
    _id: string;
    name: string;
  }
  
interface Period {
    _id: string;
    name: string;
    responsible_start_date: Date;
    responsible_end_date: Date;
}

interface DriveFile {
    id: string;
    name: string;
    view_link: string;
    download_link: string;
    folder_id: string;
}

interface FilledReport {
    dimension: Dimension
    send_by: any
    loaded_date: Date
    report_file: DriveFile
    attachments: DriveFile[]
    status: string
}

interface PublishedReport {
    _id: string
    report: Report
    dimensions: Dimension[]
    period: Period
    filled_reports: FilledReport[]
}

const ResponsibleUploadedReportsPage = () => {
    const { data: session } = useSession();
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [pubReports, setPubReports] = useState<PublishedReport[]>([]);
    const [reportFile, setReportFile] = useState<File | null>(null);
    const [isReportFileDeleted, setIsReportFileDeleted] = useState<boolean>(false);
    const [deletedAttachments, setDeletedAttachments] = useState<string[]>([]);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [opened, setOpened] = useState<boolean>(false);
    const [editing, setEditing] = useState<boolean>(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [selectedReport, setSelectedReport] = useState<PublishedReport | null>(null);
    const theme = useMantineTheme();
    const router = useRouter();

    const fetchReports = async (page: number, search: string) => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/pReports/responsible/loaded`,
                {
                    params: {
                        page: page,
                        search: search,
                        email: session?.user?.email
                    }
                }
            )
            if(response.data) {
                console.log(response.data);
                setPubReports(response.data.publishedReports);
                setTotalPages(response.data.totalPages);
            }
        } catch (error) {
            console.error(error);
            setPubReports([]);
        }
    }
    useEffect(() => {
      if(session?.user?.email) {
          const delayDebounceFn = setTimeout(() => {
              fetchReports(page, search);
          }, 500)
          return () => clearTimeout(delayDebounceFn)
      }
     }, [search, session?.user?.email, page]);

    const handleOpenReport = (report: PublishedReport) => {
      setSelectedReport(report);
      setOpened(true);
    }

    const variant = (status: string) => {
        switch (status) {
            case 'Pendiente Aprobación':
            return 'outline';
            case 'Aprobado':
            return 'filled';
            case 'Rechazado':
            return 'filled';
        }
    }

    const truncateString = (str: string, maxLength: number = 25): string => {
        return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
    }
    
    const addFilesToAttachments = (files: File[]) => {
      if(files.some((file) => attachments.some((attachment) => attachment.name === file.name)) ||
        files.some((file) => selectedReport?.filled_reports[0].attachments.some((attachment) => attachment.name === file.name))) {
        showNotification({
          title: 'Error',
          message: 'No puedes cargar dos veces el mismo archivo',
          color: 'red'
        });
        return;
      }
        setAttachments([...attachments, ...files]);
    }

    const rows = pubReports.length > 0 ? pubReports.map((pubReport: PublishedReport) => {
        return (
            <Table.Tr key={pubReport._id}>
              <Table.Td>{pubReport.period.name}</Table.Td>
              <Table.Td>{pubReport.dimensions[0].name}</Table.Td>
              <Table.Td>{format(new Date(pubReport.period.responsible_end_date), 'MMMM D, YYYY')}</Table.Td>
              <Table.Td>{truncateString(pubReport.filled_reports[0].send_by.full_name)}</Table.Td>
              <Table.Td>{format(new Date(pubReport.filled_reports[0].loaded_date), 'MMMM D, YYYY')}</Table.Td>
              <Table.Td>{pubReport.report.name}</Table.Td>
              <Table.Td>
                <Center>
                  <Badge
                    bg={pubReport.filled_reports[0].status === 'Rechazado' ? theme.colors.red[9] : pubReport.filled_reports[0].status === 'Pendiente Aprobación' ? theme.colors.yellow[9] : theme.colors.green[9]}
                    c={pubReport.filled_reports[0].status === 'Rechazado' ? theme.colors.red[0] : pubReport.filled_reports[0].status === 'Pendiente Aprobación' ? theme.colors.yellow[0] : theme.colors.green[0]}
                    variant={'light'}
                  >
                    {pubReport.filled_reports[0].status}
                  </Badge>
                </Center>
              </Table.Td>
              <Table.Td>
                <Center>
                  <Group>
                    <Tooltip label='Ver detalles del reporte' withArrow>
                      <Button variant='outline' onClick={() => handleOpenReport(pubReport)}>
                        <IconFileDescription size={16} />
                      </Button>
                    </Tooltip>
                    <Tooltip label='Modificar reporte enviado' withArrow>
                      <Button variant='outline' onClick={() => {
                        setSelectedReport(pubReport);
                        setEditing(true);
                      }}>
                        <IconEdit size={16} />
                      </Button>
                    </Tooltip>
                  </Group>
                </Center>
              </Table.Td>
            </Table.Tr>
        );
    }) : (
        <Table.Tr>
            <Table.Td colSpan={10}>No se encontraron reportes</Table.Td>
        </Table.Tr>
    );
    
    return (
        <Container size="xl">
          <DateConfig />
          <Title ta="center" mb={"md"}>Reportes Enviados</Title>
          <TextInput
              placeholder='Buscar en los reportes publicados'
              value={search}
              onChange={(event) => setSearch(event.currentTarget.value)}
              mb="md"
          />
          <Group>
              <Button 
                  onClick={() => router.push('/responsible/reports')}
                  variant="outline"
                  leftSection={<IconArrowLeft size={16} />}>
                  Ir a Reportes Pendientes
              </Button>
          </Group>
          <Table striped withTableBorder mt="md">
              <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Periodo</Table.Th>
                    <Table.Th>Dimensión</Table.Th>
                    <Table.Th>Fecha Límite</Table.Th>
                    <Table.Th>Enviado Por</Table.Th>
                    <Table.Th>Fecha Envío</Table.Th>
                    <Table.Th>Reporte</Table.Th>
                    <Table.Th><Center>Estado</Center></Table.Th>
                    <Table.Td><Center>Acciones</Center></Table.Td>
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
              opened={opened}
              onClose={() => setOpened(false)}
              size="md"
              overlayProps={{
                backgroundOpacity: 0.55,
                blur: 3,
              }}
              withCloseButton={false}
          >
            <Text size='xl' mb={'md'} fw={700} ta={'center'}>{selectedReport?.report.name}</Text>
            <Text mb={'md'} size='md' ta={'justify'}>{selectedReport?.report.description || 'Sin descripción'}</Text>
            <Divider mb={'sm'}/>
            <Group gap={'xs'}>
              <Text size='md'>Reporte enviado: </Text>
              <Pill 
                  style={{ cursor: 'pointer' }}
                  bg={theme.colors.blue[8]}
                  size='sm'
                  onClick={() => {
                      if (typeof window !== "undefined") {
                          window.open(selectedReport?.filled_reports[0].report_file.view_link);
                      }   
                  }}
              >
                  {selectedReport?.filled_reports[0].report_file.name}
              </Pill>
            </Group>
            {selectedReport?.report.requires_attachment && (
              <>
                <Divider mt={'md'}/>
                <Group gap={'xs'} mt={'sm'}>
                    <Text size='md'>Anexos enviados: </Text>
                    <PillGroup>
                    {selectedReport?.filled_reports[0].attachments.map((attachment: DriveFile) => {
                        return (
                        <Pill 
                            key={attachment.id}
                            style={{ cursor: 'pointer' }}
                            bg={'gray'}
                            size='sm'
                            onClick={() => {
                                if (typeof window !== "undefined") {
                                    window.open(attachment.view_link);
                                }   
                            }}
                        >
                            {attachment.name}
                        </Pill>
                        );
                    })}
                    </PillGroup>
                </Group>
              </>
            )}
          </Modal>
          <Modal
              opened={editing}
              onClose={() => {
                setEditing(false)
                setIsReportFileDeleted(false);
              }}
              size="md"
              overlayProps={{
                backgroundOpacity: 0.55,
                blur: 3,
              }}
              withCloseButton={false}
          >
            <Text size='xl' mb={'md'} fw={700} ta={'center'}>{selectedReport?.report.name}</Text>
            {loading ? (
              <Center>
                <Lottie animationData={uploadAnimation} loop={true} />
              </Center>
            ) : success ? (
              <Center>
                <Lottie animationData={successAnimation} loop={false} />
              </Center>
            ): <>
              <Text mb={'md'} size='md'>Cargar Formato de Reporte: <Text component="span" c={theme.colors.red[8]}>*</Text></Text>
              <Dropzone
                onDrop={(files) => {
                  if(files.length > 1) {
                    showNotification({
                      title: 'Solo puedes cargar un archivo',
                      message: 'En el reporte solo puedes cargar un archivo',
                      color: 'red',
                    });
                    return;
                  }
                  setIsReportFileDeleted(true);
                  setReportFile(files[0])
                }}
                className={classes.dropzone}
                radius="md"
                mx={'auto'}
                mt={'md'}
              >
                <div style={{ cursor: 'pointer' }}>
                  <Group justify="center" pt={'md'}>
                    <Dropzone.Accept>
                      <IconDownload
                        style={{ width: rem(40), height: rem(40) }}
                        color={theme.colors.blue[6]}
                        stroke={1.5}
                      />
                    </Dropzone.Accept>
                    <Dropzone.Reject>
                      <IconX
                        style={{ width: rem(40), height: rem(40) }}
                        color={theme.colors.red[6]}
                        stroke={1.5}
                      />
                    </Dropzone.Reject>
                    <Dropzone.Idle>
                      <IconCloudUpload style={{ width: rem(40), height: rem(40) }} stroke={1.5} />
                    </Dropzone.Idle>
                  </Group>
                  <Text ta="center" fz="sm" c="dimmed" mb={'sm'}>
                    Selecciona el archivo con tu reporte en formato .pdf o .docx
                  </Text>
                </div>
              </Dropzone>
              {selectedReport?.filled_reports[0].report_file && !isReportFileDeleted && (
                <Pill 
                  mt={'sm'} 
                  withRemoveButton
                  onRemove={() => setIsReportFileDeleted(true)}
                  bg={'gray'}
                >
                  {selectedReport?.filled_reports[0].report_file.name}
                </Pill>
              )}
              {reportFile?.name && <Pill 
                mt={'sm'} 
                withRemoveButton
                onRemove={() => setReportFile(null)}
                bg={'gray'}
              >
                {reportFile?.name}
              </Pill>}
              {selectedReport?.report.requires_attachment && (
                <>
                  <Text mt={'md'}>Anexos: <Text component="span" c={theme.colors.red[8]}>*</Text></Text>
                  <Dropzone
                    onDrop={addFilesToAttachments}
                    className={classes.dropzone}
                    radius="md"
                    mx={'auto'}
                    mt={'md'}
                    multiple
                  >
                    <div style={{ cursor: 'pointer', marginBottom: '0px' }}>
                      <Group justify="center" pt={'md'}>
                        <Dropzone.Accept>
                          <IconDownload
                            style={{ width: rem(40), height: rem(40) }}
                            color={theme.colors.blue[6]}
                            stroke={1.5}
                          />
                        </Dropzone.Accept>
                        <Dropzone.Reject>
                          <IconX
                            style={{ width: rem(40), height: rem(40) }}
                            color={theme.colors.red[6]}
                            stroke={1.5}
                          />
                        </Dropzone.Reject>
                        <Dropzone.Idle>
                          <IconCloudUpload style={{ width: rem(40), height: rem(40) }} stroke={1.5} />
                        </Dropzone.Idle>
                      </Group>
                      <Text ta="center" fz="sm" c="dimmed" mb={'sm'}>
                        Selecciona los anexos de tu reporte (mínimo 1)
                      </Text>
                    </div>
                  </Dropzone>
                    <PillGroup mt={'sm'} mb={'xs'}>
                      {attachments.map((attachment, index) => (
                        <Pill
                          key={attachment.name}
                          bg={'gray'}
                          withRemoveButton 
                          onRemove={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                        >
                          {attachment.name}
                        </Pill>
                      ))}
                      {selectedReport.filled_reports[0].attachments.map(attachment => {
                        return !deletedAttachments.includes(attachment.id) && (
                          <Pill
                            key={attachment.name}
                            bg={'gray'}
                            withRemoveButton 
                            onRemove={() => setDeletedAttachments([...deletedAttachments, attachment.id])}
                          >
                            {attachment.name}
                          </Pill>
                        );
                      })}
                    </PillGroup>
                </>
              )}
              <Group mt="md" grow>
                <Button>
                  Guardar
                </Button>
                <Button variant="outline" onClick={() => {
                  setEditing(false)
                  setIsReportFileDeleted(false);
                }}>
                  Cancelar
                </Button>
              </Group>
            </>
          }
          </Modal>
        </Container>
    )
}

export default ResponsibleUploadedReportsPage;