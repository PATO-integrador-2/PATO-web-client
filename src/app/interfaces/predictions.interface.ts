// VISTA 1

export interface MpiItem{
    año: string,
    dominio: string,
    ipm_predicho: number
}

export interface DeprivationsItem{
    year: number,
    variable: string,
    domain: string,
    ipm_foretold: number
}
export interface PercentageItem{
    año: string,
    dominio: string,
    porcentaje_privaciones: number
}

export interface DimensionItem{
    year: string,
    dimension: string,
    domain: string,
    percentage_contribution: string

}

export interface IncidenceBySexItem{
    year: number,
    sex: string,
    domain: string,
    predicted_percentage: number

}

export interface IncidenceByHeadSexItem{
    year: number,
    sex: string,
    domain: string,
    predicted_percentage: number

}

// VISTA 3

export interface ContributionLatamItem{
    year: number,
    privation: string,
    country: string,
    predicted_value: string

}

export interface NationalPovertyItem{
    year: number,
    country: string,
    area: string,
    measure: string,
    predicted_value: string

}

export interface PovertyByAgeItem{
    year: number,
    country: string,
    area: string,
    age_range: string,
    predicted_value: string

}


