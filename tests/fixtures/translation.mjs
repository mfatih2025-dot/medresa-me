// Explicit test-only bilingual examples, never a production translator.
export function translationPair(value) {
  if (!value) return {sq:'',en:''};
  if (value.startsWith('Posjeta Medresi ')) {
    const name=value.slice('Posjeta Medresi '.length);
    return {sq:'Vizitë në Medresenë '+name,en:'Visit to the '+name+' Medresa'};
  }
  if(value.startsWith('Datum ')) return {
    sq:value.replace('Datum ','Data ').replace(', iznos ', ', shuma ').replace(' i račun ', ' dhe llogaria '),
    en:value.replace('Datum ','Date ').replace(', iznos ', ', amount ').replace(' i račun ', ' and account '),
  };
  const examples={
    'Učenici su posjetili Medresu.':['Nxënësit vizituan Medresenë.','The students visited the Medresa.'],
    'Učenici ispred Medrese':['Nxënësit para Medresesë','Students outside the Medresa'],
    'Ovo je drugi pasus.\nOvo je drugi red.':['Ky është paragrafi i dytë.\nKy është rreshti i dytë.','This is the second paragraph.\nThis is the second line.'],
    'Znanje je važno.':['Dituria është e rëndësishme.','Knowledge matters.'],
    'Iz naše škole':['Nga shkolla jonë','From our school'],
    'Zajedništvo učenika i nastavnika.':['Bashkimi i nxënësve dhe mësuesve.','Students and teachers together.'],
    'Nastavak naše vijesti.':['Vazhdimi i lajmit tonë.','Our news continues.'],
    'Znanje nas povezuje.':['Dituria na bashkon.','Knowledge brings us together.'],
    'Naša škola':['Shkolla jonë','Our school'],
  };
  if(!examples[value])throw new Error('Missing explicit translation fixture');
  return {sq:examples[value][0],en:examples[value][1]};
}
