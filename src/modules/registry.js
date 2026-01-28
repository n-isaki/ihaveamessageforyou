
import { TasseExperience } from './experiences/tasse';
import { NoorExperience } from './experiences/noor';
import { MemoriaExperience } from './experiences/memoria';
import { BraceletExperience } from './experiences/bracelet';

const experiences = {
    kamlimos: TasseExperience,
    tasse: TasseExperience,
    noor: NoorExperience,
    dua: NoorExperience, // Alias
    memoria: MemoriaExperience,
    ritual: BraceletExperience,
    bracelet: BraceletExperience
};

export const getExperience = (gift) => {
    if (!gift) return TasseExperience;

    // 1. By Project Name
    if (gift.project && experiences[gift.project]) {
        return experiences[gift.project];
    }

    // 2. By Product Type
    if (gift.productType === 'bracelet') {
        return BraceletExperience;
    }

    // 3. Default
    return TasseExperience;
};
