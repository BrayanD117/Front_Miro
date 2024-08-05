"use client";

import { useEffect } from 'react';
import { setGlobalDateI18n } from 'fecha';

const spanishLocale = {
  dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'] as [string, string, string, string, string, string, string],
  dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'] as [string, string, string, string, string, string, string],
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'] as [string, string, string, string, string, string, string, string, string, string, string, string],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'] as [string, string, string, string, string, string, string, string, string, string, string, string],
  amPm: ['AM', 'PM'] as [string, string]
};

const DateConfig = () => {
  useEffect(() => {
    setGlobalDateI18n(spanishLocale);
  }, []);

  return null;
};

export default DateConfig;