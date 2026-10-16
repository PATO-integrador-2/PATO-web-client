import { Type } from '@angular/core';

export interface WidgetItem {
    id: number;
    label: string;
    content: Type<unknown>;
}

export interface WidgetItemPredict {
    id: number;
    label: string;
    content: Type<unknown>;
    title?: string;
    data?: any[];

}

export interface WidgetItemDash {
    id: number;
    label: string;
    content: any;
    filterFields: Array<'year' | 'domain' | 'country' | 'area' | 'region' | 'dept'>;
    getYearsSignal?: () => number[];
    getDeptsSignal?: () => string[];
    getCountriesByYear?: (year?: number) => string[];
    getAreasByYear?: (year?: number) => string[];
    getDeptsByYear?: (year?: number) => string[];
    getAreasByYearAndCountry?: (year?: number, country?: string) => string[];
    getDomainsByYear?: (year?: number) => string[];
    getRegionsByYear?: (year?: number) => string[];
    getDeptsByYearAndRegion?: (year?: number, region?: string) => string[];
    getAreasByYearAndDept?: (year?: number, dept?: string) => string[];
    getDomainsSignal?: () => string[];
    loadData: (filters: any) => void;
}
// Dashboard 1

export interface MpiItem {
    anio: number;
    dominio: string;
    ipm: string;
}

export interface DeprivationsItem {
    anio: number;
    dominio: string;
    variable: string;
    ipm: number;
}

export interface IntensityPovertyItem {
    anio: number;
    dominio: string;
    porcentaje: string;
}

export interface ContributionImpactItem {
    anio: number;
    dominio: string;
    dimension: string;
    porcentaje: string;
}

export interface MpiSexItem {
    anio: number;
    dominio: string;
    sexo: string;
    porcentaje: string;
}

export interface MpiBossSexItem {
    anio: number;
    dominio: string;
    sexo: string;
    porcentaje: string;
}

// Dashboard 2

export interface IndicatorDeptItem {
    anio: number;
    region: string;
    departamento: string;
    personas_que_habitan_ese_hogar: number;
    privacion_bajo_logro_educativo: number;
    privacion_analfabetismo: number;
    privacion_inasistencia_escolar: number;
    privacion_rezago_escolar: number;
    privacion_atencion_integral_primera_infancia: number;
    privacion_trabajo_infantil: number;
    pprivacion_no_aseguramiento_salud: number;
    privacion_barreras_acceso_salud: number;
    privacion_desempleo_larga_duracion: number;
    privacion_tasa_empleo_formal: number;
    privacion_no_acceso_agua_mejorada: number;
    privacion_inadecuado_material_piso: number;
    privacion_inadecuado_material_paredes: number;
    privacion_hacinamiento_critico: number;
    ipm: number;
    pobre: number;
}

export interface MpiDeptItem {
    anio: number,
    area: string,
    departamento: string,
    ipm:string
}

export interface MpiDeptIndicatorItem {
    anio: number,
    area: string,
    departamento: string,
    porcentaje: string,
    variable: string
}

export interface MpiDeptSexItem {
    anio: number,
    departamento: string,
    porcentaje: string,
    sexo: string
}


// Dashboard 3

export interface ContributionPovertyItem {
    anio: number;
    privacion: string;
    pais: string;
    valor_porcentaje: number;
}

export interface NationalPovertyItem {
    anio: number;
    area_geografica: string;
    pais: string;
    tipo_medida_pm: string;
    valor_porcentaje: number;
}

export interface PovertyByAgeItem {
    anio: number;
    area_geografica: string;
    pais: string;
    grupo_erario: string;
    valor_porcentaje: number;
}
