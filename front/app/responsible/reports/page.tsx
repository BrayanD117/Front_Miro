"use client";

import {use, useEffect, useState} from 'react';
import axios from 'axios';
import { useSession } from 'next-auth/react';
import { Button, Center, Container, FileInput, Group, Modal, Pagination, Pill, PillGroup, rem, Table, Text, TextInput, Title, Tooltip, useMantineTheme } from '@mantine/core';
import { IconArrowRight, IconCloudUpload, IconDeviceFloppy, IconDownload, IconFileDescription, IconHistory, IconReport, IconSend, IconTrash, IconUpload, IconVocabulary, IconX } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import classes from './ResponsibleReportsPage.module.css';
import DateConfig from '@/app/components/DateConfig';
import { format } from 'fecha';
import { showNotification } from '@mantine/notifications';
import { Dropzone } from '@mantine/dropzone';
import uploadAnimation from "../../../public/lottie/upload.json";
import successAnimation from "../../../public/lottie/success.json";
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

interface PublishedReport {
    _id: string;
    report: Report;
    dimensions: Dimension;
    period: Period;
}

const ResponsibleReportsPage = () => {
    const { data: session } = useSession();
    const [loading, setLoading] = useState<boolean>(false);
    const [success, setSuccess] = useState<boolean>(false);
    const [pubReports, setPubReports] = useState<PublishedReport[]>([]);
    const [reportFile, setReportFile] = useState<File | null>(null);
    const [attachments, setAttachments] = useState<File[]>([]);
    const [opened, setOpened] = useState<boolean>(false);
    const [publishing, setPublishing] = useState<boolean>(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState("");
    const [selectedReport, setSelectedReport] = useState<PublishedReport | null>(null);
    const theme = useMantineTheme();
    const router = useRouter();

    const fetchReports = async (page: number, search: string) => {
        try {
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/pReports/responsible`,
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

    const handleCreate = async () => {
      if(!reportFile) {
        showNotification({
          title: 'Error',
          message: 'No ha cargado el archivo de reporte',
          color: 'red'
        });
        return
      }
      if(selectedReport?.report.requires_attachment && attachments.length === 0) {
        showNotification({
          title: 'Error',
          message: 'No ha cargado el(los) archivo(s) de anexo',
          color: 'red'
        });
        return
      }
      if(!selectedReport) {
        showNotification({
          title: 'Error',
          message: 'No se seleccionó un reporte',
          color: 'red'
        });
        return
      }
      if(!session?.user?.email) {
        showNotification({
          title: 'Error',
          message: 'No se encontró la sesión del usuario',
          color: 'red'
        });
        return
      }

      const formData = new FormData();
      formData.append('email', session?.user?.email);
      formData.append('reportId', selectedReport?._id);
      formData.append('reportFile', reportFile);
      attachments.forEach((attachment) => {
        formData.append('attachments', attachment);
      })
      setLoading(true);
      try {
        const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/pReports/responsible/load`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        if(response.data) {
          showNotification({
            title: 'Reporte cargado',
            message: 'El reporte se ha cargado correctamente',
            color: 'green'
          });
          setSuccess(true);
          setTimeout(() => {
            setSuccess(false);
            handleClosePublish();
            fetchReports(page, search);
          }, 3000);
        }
      } catch (error) {
        console.error(error);
        showNotification({
          title: 'Error',
          message: 'Error al cargar el reporte',
          color: 'red'
        });
      } finally {
        setLoading(false);
      }
    }

    const handleOpenReport = (report: PublishedReport) => {
      setSelectedReport(report);
      setOpened(true);
    }

    const handleClosePublish = () => {
      setSelectedReport(null);
      setAttachments([]);
      setReportFile(null);
      setPublishing(false);
      setLoading(false);
    }

    const addFilesToAttachments = (files: File[]) => {
      if(files.some((file) => attachments.some((attachment) => attachment.name === file.name))){
        showNotification({
          title: 'Error',
          message: 'No puedes cargar dos veces el mismo archivo',
          color: 'red'
        });
        return;
      }
        setAttachments([...attachments, ...files]);
    }

    const rows = pubReports?.length ? pubReports.map((pubReport: PublishedReport) => {
        return (
            <Table.Tr key={pubReport._id}>
              <Table.Td>{pubReport.period.name}</Table.Td>
              <Table.Td>{format(new Date(pubReport.period.responsible_start_date), 'MMMM D, YYYY')}</Table.Td>
              <Table.Td>{format(new Date(pubReport.period.responsible_end_date), 'MMMM D, YYYY')}</Table.Td>
              <Table.Td>{pubReport.report.name}</Table.Td>
              <Table.Td>
                <Center>
                  <Group>
                    <Tooltip label='Ver detalles del reporte' withArrow>
                      <Button variant='outline' onClick={() => handleOpenReport(pubReport)}>
                        <IconFileDescription size={16} />
                      </Button>
                    </Tooltip>
                    <Tooltip label='Descargar formato del reporte' withArrow>
                      <Button variant='outline' onClick={() => {
                        if (typeof window !== "undefined") {
                          window.open(pubReport.report.report_example_download);
                        }
                      }}>
                        <IconVocabulary size={16} />
                      </Button>
                    </Tooltip>
                    <Tooltip label='Subir reporte' withArrow>
                      <Button variant='outline' onClick={() => {
                        setPublishing(true)
                        setSelectedReport(pubReport)
                        }}
                      >
                        <IconUpload size={16} />
                      </Button>
                    </Tooltip>
                  </Group>
                </Center>
              </Table.Td>
            </Table.Tr>
        );
    }) : (
        <Table.Tr>
            <Table.Td colSpan={10}>No se encontraron reportes pendientes</Table.Td>
        </Table.Tr>
    );
    
    return (
        <Container size="xl">
            <DateConfig />
            <Title ta="center" mb={"md"}>Reportes Pendientes</Title>
            <TextInput
                placeholder='Buscar en los reportes publicados'
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                mb="md"
            />
            <Group>
                <Button 
                    onClick={() => router.push('reports/uploaded')}
                    variant="outline"
                    ml={"auto"}
                    rightSection={<IconArrowRight size={16} />}>
                    Ir a Reportes Enviados
                </Button>
            </Group>
            <Table striped withTableBorder mt="md">
                <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Periodo</Table.Th>
                      <Table.Th>Fecha Inicio</Table.Th>
                      <Table.Th>Fecha Límite</Table.Th>
                      <Table.Th>Reporte</Table.Th>
                      <Table.Td fw={700}><Center>Acciones</Center></Table.Td>
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
                size="sm"
                overlayProps={{
                  backgroundOpacity: 0.55,
                  blur: 3,
                }}
                withCloseButton={false}
            >
              <Text size='xl' mb={'md'} fw={700} ta={'center'}>{selectedReport?.report.name}</Text>
              <Text mb={'md'} size='md' ta={'justify'}>{selectedReport?.report.description || 'Sin descripción'}</Text>
              <Text size='md'>Requiere Anexo(s): {selectedReport?.report.requires_attachment ? 'Sí' : 'No'}</Text>
              <Button
                variant='outline'
                mt='md'
                leftSection={<IconDownload size={16} />}
                onClick={() => {
                  useEffect(() => {
                    if (typeof window !== "undefined")
                      window.open(selectedReport?.report.report_example_download)
                  }, [selectedReport])
                }}
                >
                Descargar Formato
              </Button>
            </Modal>
            <Modal
                opened={publishing}
                onClose={() => handleClosePublish()}
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
                  {reportFile && (
                    <Pill 
                      mt={'sm'} 
                      withRemoveButton
                      onRemove={() => setReportFile(null)}
                      bg={'gray'}
                    >
                      {reportFile?.name}
                    </Pill>
                  )}
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
                      </PillGroup>
                  </>
                )}
                <Group mt="md" grow>
                  <Button leftSection={<IconDeviceFloppy/>}>
                    Guardar Borrador
                  </Button>
                  <Button variant="outline" onClick={() => setPublishing(false)} color='red' rightSection={<IconTrash/>}>
                    Cancelar
                  </Button>
                </Group>
                <Button onClick={handleCreate} fullWidth mt={'md'} disabled={true}>
                  Enviar
                </Button>
              </>
            }
            </Modal>
        </Container>
    )
}

export default ResponsibleReportsPage;