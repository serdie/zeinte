
// src/lib/studyInterestsData.ts

export interface InterestOption {
  id: string;
  nameKey: string;
  isCustomEntry?: boolean;
}

export interface InterestCategory {
  id: string;
  nameKey: string;
  options: InterestOption[];
}

export const categorizedStudyInterests: InterestCategory[] = [
  {
    id: 'category_oposiciones',
    nameKey: 'profilePage.categoryOposiciones',
    options: [
      { id: 'oposicion_hacienda', nameKey: 'profilePage.interestOppHacienda' },
      { id: 'oposicion_administrativo', nameKey: 'profilePage.interestOppAdminGeneral' },
      { id: 'oposicion_justicia', nameKey: 'profilePage.interestOppJustice' },
      { id: 'oposicion_seguridad', nameKey: 'profilePage.interestOppSecurity' },
      { id: 'oposicion_sanidad', nameKey: 'profilePage.interestOppHealth' },
      { id: 'oposicion_educacion', nameKey: 'profilePage.interestOppEducation' },
      { id: 'oposicion_forestal', nameKey: 'profilePage.interestOppForestal' },
      { id: 'oposicion_otra_custom', nameKey: 'profilePage.interestOppOtherCustom', isCustomEntry: true },
    ],
  },
  {
    id: 'category_universidad',
    nameKey: 'profilePage.categoryUniversidad',
    options: [
      { id: 'universidad_ingenieria', nameKey: 'profilePage.interestUniEngineering' },
      { id: 'universidad_derecho', nameKey: 'profilePage.interestUniLaw' },
      { id: 'universidad_ade', nameKey: 'profilePage.interestUniBusiness' },
      { id: 'universidad_medicina', nameKey: 'profilePage.interestUniMedicine' },
      { id: 'universidad_otra_custom', nameKey: 'profilePage.interestUniOtherCustom', isCustomEntry: true },
    ],
  },
  {
    id: 'category_instituto',
    nameKey: 'profilePage.categoryInstituto',
    options: [
      { id: 'instituto_bachillerato_selectividad', nameKey: 'profilePage.interestHighSchoolEvaU' },
      { id: 'instituto_eso', nameKey: 'profilePage.interestInstitutoESO' },
      { id: 'instituto_fp_medio', nameKey: 'profilePage.interestInstitutoFPGMedio' },
      { id: 'instituto_fp_superior', nameKey: 'profilePage.interestInstitutoFPGSuperior' },
      { id: 'instituto_otro_custom', nameKey: 'profilePage.interestInstitutoOtherCustom', isCustomEntry: true },
    ],
  },
  {
    id: 'category_idiomas',
    nameKey: 'profilePage.categoryIdiomas',
    options: [
      { id: 'idiomas_ingles_c1', nameKey: 'profilePage.interestLangEnglishC1' },
      { id: 'idiomas_ingles_b2', nameKey: 'profilePage.interestLangEnglishB2' },
      { id: 'idiomas_frances_b1', nameKey: 'profilePage.interestLangFrenchB1' },
      { id: 'idiomas_otro_custom', nameKey: 'profilePage.interestLangOtherCustom', isCustomEntry: true },
    ],
  },
  {
    id: 'category_permisos_conducir',
    nameKey: 'profilePage.categoryPermisosConducir',
    options: [
      { id: 'permiso_conducir_b', nameKey: 'profilePage.interestDrivingLicenseB' },
      { id: 'permiso_conducir_a2', nameKey: 'profilePage.interestDrivingLicenseA2' },
      { id: 'permiso_conducir_c', nameKey: 'profilePage.interestDrivingLicenseC' },
      { id: 'permiso_conducir_otro_custom', nameKey: 'profilePage.interestDrivingLicenseOtherCustom', isCustomEntry: true },
    ],
  },
  {
    id: 'category_certificaciones',
    nameKey: 'profilePage.categoryCertificaciones',
    options: [
        { id: 'certificaciones_it', nameKey: 'profilePage.interestCertIT' },
        { id: 'certificaciones_financieras', nameKey: 'profilePage.interestCertFinanzas' },
        { id: 'certificaciones_otra_custom', nameKey: 'profilePage.interestCertOtherCustom', isCustomEntry: true },
    ]
  },
  {
    id: 'category_estudio_general',
    nameKey: 'profilePage.categoryEstudioGeneral',
    options: [
      { id: 'estudio_general_conocimiento', nameKey: 'profilePage.interestGeneralStudy' },
      { id: 'estudio_otro_custom_main', nameKey: 'profilePage.interestOtherStudiesCustomMain', isCustomEntry: true },
    ],
  },
];
