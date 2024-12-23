"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Modal, Button, Select, Container, Grid, Card, Text, Group, Title, Center, Indicator, useMantineColorScheme} from "@mantine/core";
import { showNotification } from "@mantine/notifications";
import axios from "axios";
import { IconHexagon3d, IconBuilding, IconFileAnalytics, IconCalendarMonth, IconZoomCheck, IconUserHexagon, IconReport, IconFileUpload, IconUserStar, IconChecklist, IconClipboardData, IconReportSearch, IconFilesOff, IconCheckbox, IconHomeCog, IconClipboard } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useRole } from "../context/RoleContext";
import { useColorScheme } from "@mantine/hooks";

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>("");
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);
  const { userRole, setUserRole } = useRole();
  const [notificationShown, setNotificationShown] = useState(false);
  const [isResponsible, setIsResponsible] = useState(false);
  const colorScheme = useColorScheme();

  useEffect(() => {
    const fetchUserRoles = async () => {
      if (session?.user?.email && !notificationShown) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/users/roles`,
            { params: { email: session.user.email } }
          );
          setAvailableRoles(response.data.roles);
          if (!response.data.activeRole) {
            setOpened(true);
          } else {
            if (userRole !== response.data.activeRole) {
              setUserRole(response.data.activeRole);
              showNotification({
                title: "Bienvenido",
                message: `Tu rol actual es ${response.data.activeRole}`,
                autoClose: 5000,
                color: "teal",
              });
              setNotificationShown(true);
            }
          }
        } catch (error) {
          console.error("Error fetching roles:", error);
        }
      }
    };

    if (status === "authenticated") {
      fetchUserRoles();
    }
  }, [session, status, notificationShown, userRole]);

  useEffect(() => {
    const checkIfUserIsResponsible = async () => {
      if (session?.user?.email) {
        try {
          const response = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/dependencies/all`,
            { params: { search: session.user.email } }
          );
          const userDependencies = response.data.dependencies.filter(
            (dependency: any) => dependency.responsible === session.user?.email
          );
          setIsResponsible(userDependencies.length > 0);
        } catch (error) {
          console.error("Error checking user responsibilities:", error);
        }
      }
    };

    checkIfUserIsResponsible();
  }, [session]);

  const handleRoleSelect = async (role: string) => {
    if (!session?.user?.email) return;

    try {
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/users/updateActiveRole`,
        {
          email: session.user.email,
          activeRole: role,
        }
      );
      console.log("Active role updated:", response.data);
      setUserRole(role);
      setOpened(false);
      showNotification({
        title: "Rol actualizado",
        message: `Tu nuevo rol es ${role}`,
        autoClose: 5000,
        color: "teal",
      });
    } catch (error) {
      console.error("Error updating active role:", error);
      showNotification({
        title: "Error",
        message: "No se pudo actualizar el rol",
        autoClose: 5000,
        color: "red",
      });
    }
  };

  const renderCards = () => {
    const cards = [];

    switch (userRole) {
      case "Administrador":
        cards.push(
          <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="admin-templates">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Center><IconFileAnalytics size={80}/></Center>
              <Group mt="md" mb="xs">
                <Text ta={"center"} w={500}>Configurar Plantillas</Text>
              </Group>
              <Text ta={"center"} size="sm" color="dimmed">
                Crea, edita, elimina o asigna plantillas a los productores.
              </Text>
              <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/admin/templates')}>
                Ir a Configurar Plantillas
              </Button>
            </Card>
          </Grid.Col>,
          <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="admin-published-templates">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Center><IconChecklist size={80}></IconChecklist></Center>
              <Group mt="md" mb="xs">
                  <Text ta={"center"} w={500}>Gestionar Plantillas</Text>
              </Group>
              <Text ta={"center"} size="sm" color="dimmed">
                Administra las plantillas cargadas por los productores.
              </Text>
              <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/templates/published')}>
                Ir a Gestión de Plantillas
              </Button>
            </Card>
          </Grid.Col>,
          <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="producers-reports">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Center>
                <IconClipboardData size={80}/>
              </Center>
              <Group mt="md" mb="xs">
                <Text ta={"center"} w={500}>Configurar Informes Productores</Text>
              </Group>
              <Text ta={"center"} size="sm" color="dimmed">
                Crea, edita y asigna los informes que generarán los productores.
                </Text>
              <Button
                variant="light"
                fullWidth
                mt="md"
                radius="md"
                onClick={() => router.push('/admin/reports/producers')}
              >
                Ir a Configuración de Informes
              </Button>
            </Card>
          </Grid.Col>,
          <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="uploaded-reports-producers">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Center>
                <IconReportSearch size={80}/>
              </Center>
              <Group mt="md" mb="xs">
                <Text ta={"center"} w={500}>Gestionar Informes Productores</Text>
              </Group>
              <Text ta={"center"} size="sm" color="dimmed">
                Gestiona el proceso de cargue de los informes por parte de los productores.
              </Text>
              <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/reports')}>
                Ir a Gestión de Informes
              </Button>
            </Card>
          </Grid.Col>,
          <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="admin-reports">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
               <Center style={{ position: "relative" }}>
                <IconClipboard size={80}/>
                <IconHexagon3d size={36} style={{ position: "absolute", top: "57%", left: "50%", transform: "translate(-50%, -50%)" }}/>
              </Center>
              <Group mt="md" mb="xs">
                <Text ta={"center"} w={500}>Configurar Informes Dimensiones</Text>
              </Group>
              <Text ta={"center"} size="sm" color="dimmed">
                Crea, edita y asigna los informes que generarán las dimensiones.
              </Text>
              <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/admin/reports')}>
                Ir a Configuración de Informes
              </Button>
            </Card>
          </Grid.Col>,
          <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="uploaded-reports">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Center>
                <IconReportSearch size={80}/>
              </Center>
              <Group mt="md" mb="xs">
                <Text ta={"center"} w={500}>Gestionar Informes Dimensiones</Text>
              </Group>
              <Text ta={"center"} size="sm" color="dimmed">
                Gestiona el proceso de cargue de los informes por parte de las dimensiones.
              </Text>
              <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/admin/reports/uploaded')}>
                Ir a Gestión de Informes
              </Button>
            </Card>
          </Grid.Col>,
          <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="admin-periods">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Center><IconCalendarMonth size={80}/></Center>
              <Group mt="md" mb="xs">
                <Text ta={"center"} w={500}>Gestionar Periodos</Text>
              </Group>
              <Text ta={"center"} size="sm" color="dimmed">
                Administra todos los periodos de la plataforma Miró.
              </Text>
              <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/admin/periods')}>
                Ir a Gestión de Periodos
              </Button>
            </Card>
          </Grid.Col>,
          <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="admin-dimensions">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Center><IconHexagon3d size={80}/></Center>
              <Group mt="md" mb="xs">
                <Text ta={"center"} w={500}>Gestionar Dimensiones</Text>
              </Group>
              <Text ta={"center"} size="sm" color="dimmed">
                Administra las dimensiones y sus responsables.
              </Text>
              <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/admin/dimensions')}>
                Ir a Gestión de Dimensiones
              </Button>
            </Card>
          </Grid.Col>,
          <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="admin-dependencies">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Center><IconBuilding size={80}/></Center>
              <Group mt="md" mb="xs">
                <Text ta={"center"} w={500}>Gestionar Dependencias</Text>
              </Group>
              <Text ta={"center"} size="sm" color="dimmed">
                Administra las dependencias y sus responsables.
              </Text>
              <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/admin/dependencies')}>
                Ir a Gestión de Dependencias
              </Button>
            </Card>
          </Grid.Col>,
          <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="admin-validations">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Center><IconZoomCheck size={80}/></Center>
              <Group mt="md" mb="xs">
                <Text ta={"center"} w={500}>Gestionar Validaciones</Text>
              </Group>
              <Text ta={"center"} size="sm" color="dimmed">
                Administra todas las validaciones para asignarlas en las plantillas.
              </Text>
              <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/admin/validations')}>
                Ir a Gestión de Validaciones
              </Button>
            </Card>
          </Grid.Col>,
          <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="admin-users">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Center><IconUserHexagon size={80}></IconUserHexagon></Center>
              <Group mt="md" mb="xs">
                  <Text ta={"center"} w={500}>Gestionar Usuarios</Text>
              </Group>
              <Text ta={"center"} size="sm" color="dimmed">
                Administra los roles y permisos de los usuarios.
              </Text>
              <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/admin/users')}>
                Ir a Gestión de Usuarios
              </Button>
            </Card>
            </Grid.Col>,
              <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="admin-logs">
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Center><IconFilesOff size={80}/></Center>
                <Group mt="md" mb="xs">
                  <Text ta={"center"} w={500}>Valida los Registros de Error</Text>
                </Group>
                <Text ta={"center"} size="sm" color="dimmed">
                  Verifica los registros de error de las plantillas cargadas.
                </Text>
                <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/admin/logs')}>
                  Ir a los registros de error
                </Button>
              </Card>
            </Grid.Col>,
            <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="admin-homeSettings">
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Center><IconHomeCog size={80}/></Center>
                <Group mt="md" mb="xs">
                  <Text ta={"center"} w={500}>Ajustes Pagina Inicial</Text>
                </Group>
                <Text ta={"center"} size="sm" color="dimmed">
                  Ajusta la información de la pagina de inicio.
                </Text>
                <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/admin/homeSettings')}>
                  Ir a los ajustes de inicio
                </Button>
              </Card>
            </Grid.Col>,
        );
        break;
      case "Responsable":
        cards.push(
          // <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="responsible-templates">
          //   <Card shadow="sm" padding="lg" radius="md" withBorder>
          //     <Center><IconFileAnalytics size={80}/></Center>
          //     <Group mt="md" mb="xs">
          //       <Text ta={"center"} w={500}>Crear | Asignar Plantillas</Text>
          //     </Group>
          //     <Text ta={"center"} size="sm" color="dimmed">
          //       Crea y gestiona las plantillas que llenarán los usuarios.
          //     </Text>
          //     <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/responsible/templates')}>
          //       Ir a Gestión de Plantillas
          //     </Button>
          //   </Card>
          // </Grid.Col>,
          <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="responsible-published-templates">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Center><IconChecklist size={80}></IconChecklist></Center>
              <Group mt="md" mb="xs">
                  <Text ta={"center"} w={500}>Gestionar Plantillas</Text>
              </Group>
              <Text ta={"center"} size="sm" color="dimmed">
                Administra las plantillas cargadas por los productores.
              </Text>
              <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/templates/published')}>
                Ir a Plantillas Cargadas
              </Button>
            </Card>
          </Grid.Col>,
          <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="responsible-reports">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
             <Center><IconClipboardData size={80}/></Center>
             <Group mt="md" mb="xs">
               <Text ta={"center"} w={500}>Gestionar Informes Productores</Text>
             </Group>
             <Text ta={"center"} size="sm" color="dimmed">
               Revisa los informes que rindieron los productores a tu dimensión.
             </Text>
             <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/reports')}>
               Ir a Informes de Productores
             </Button>
            </Card>
         </Grid.Col>,
          <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="dimension-reports">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Center style={{ position: "relative" }}>
                <IconClipboard size={80}/>
                <IconHexagon3d size={36} style={{ position: "absolute", top: "57%", left: "50%", transform: "translate(-50%, -50%)" }}/>
                </Center>
              <Group mt="md" mb="xs">
                <Text ta={"center"} w={500}>Gestionar Informes Dimensión</Text>
              </Group>
              <Text ta={"center"} size="sm" color="dimmed">
                Gestiona los informes de la dimensión en que eres responsable.
              </Text>
              <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/responsible/reports')}>
                Ir a Informes de Dimensión
              </Button>
            </Card>
          </Grid.Col>,
        // <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="responsible-dimensions">
        //   <Card shadow="sm" padding="lg" radius="md" withBorder>
        //     <Center><IconHexagon3d size={80}/></Center>
        //     <Group mt="md" mb="xs">
        //       <Text ta={"center"} w={500}>Gestionar Mi Dimensión</Text>
        //     </Group>
        //     <Text ta={"center"} size="sm" color="dimmed">
        //       Gestiona la dimensión de la que eres responsable.
        //     </Text>
        //     <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/responsible/dimension')}>
        //       Ir a Gestión de Mi Dimensión
        //     </Button>
        //   </Card>
        // </Grid.Col>,
        );
        break;
      case "Productor":
        cards.push(
          <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="producer-my-templates">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Center><IconFileAnalytics size={80}/></Center>
              <Group mt="md" mb="xs">
                <Text ta={"center"} w={500}>Gestionar Plantillas</Text>
              </Group>
              <Text ta={"center"} size="sm" color="dimmed">
                Gestiona las plantillas que te asignaron y tienes disponibles.
              </Text>
              <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/producer/templates')}>
                Ir a Gestionar Plantillas
              </Button>
            </Card>
          </Grid.Col>,
          // <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="producer-send-info">
          //   <Card shadow="sm" padding="lg" radius="md" withBorder>
          //     <Center><IconFileUpload size={80}/></Center>
          //     <Group mt="md" mb="xs">
          //       <Text ta={"center"} w={500}>Plantillas Enviadas</Text>
          //     </Group>
          //     <Text ta={"center"} size="sm" color="dimmed">
          //       Gestiona la información de tus plantillas cargadas.
          //     </Text>
          //     <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/producer/templates/uploaded')}>
          //       Ir a Plantillas Enviadas
          //     </Button>
          //   </Card>
          // </Grid.Col>,
          <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="producer-reports">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Center><IconClipboardData size={80}/></Center>
            <Group mt="md" mb="xs">
              <Text ta={"center"} w={500}>Gestionar Informes</Text>
            </Group>
            <Text ta={"center"} size="sm" color="dimmed">
              Revisa los informes asignados a la dependencia donde te encuentras
            </Text>
            <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/producer/reports')}>
              Ir a Informes de Productores
            </Button>
          </Card>
        </Grid.Col>,
          <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="producer-validations">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Center><IconCheckbox size={80}/></Center>
            <Group mt="md" mb="xs">
              <Text ta={"center"} w={500}>Validaciones</Text>
            </Group>
            <Text ta={"center"} size="sm" color="dimmed">
              Conoce todas las validaciones que se han asignado a tus plantillas.
            </Text>
            <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/validations')}>
              Ir a Validaciones
            </Button>
          </Card>
        </Grid.Col>,
        );
        break;
      case "Usuario":
      default:
        cards.push(
          <Container key="default-message">
            <Text>Bienvenido al sistema. Por favor selecciona un rol desde el menú superior.</Text>
          </Container>
        );
        break;
    }

    if (isResponsible) {
      cards.push(
        <Grid.Col span={{ base: 12, md: 5, lg: 4 }} key="administer-dependency">
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Center><IconUserStar size={80}/></Center>
            <Group mt="md" mb="xs">
              <Text ta={"center"} w={500}>Administrar Mi Dependencia</Text>
            </Group>
            <Text ta={"center"} size="sm" color="dimmed">
              Administra la dependencia de la cual eres responsable.
            </Text>
            <Button variant="light" fullWidth mt="md" radius="md" onClick={() => router.push('/dependency')}>
              Ir a Gestión de Dependencia
            </Button>
          </Card>
        </Grid.Col>
      );
    }

    return cards;
  };

  return (
    <>
      <Container>
        <Center>
          <Title mt="md" mb="md">Inicio</Title>
        </Center>
        <Grid justify="center" align="center">
          {renderCards()}
        </Grid>
      </Container>
      <Modal
        opened={opened}
        onClose={() => {}}
        title="Selecciona un rol"
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
        withCloseButton={false}
      >
        <Select
          label="Selecciona uno de tus roles"
          placeholder="Elige un rol"
          data={availableRoles}
          value={selectedRole}
          onChange={(value) => setSelectedRole(value || "")}
        />
        <Button
          mt="md"
          onClick={() => handleRoleSelect(selectedRole)}
          disabled={!selectedRole}
        >
          Guardar
        </Button>
      </Modal>
    </>
  );
};

export default DashboardPage;