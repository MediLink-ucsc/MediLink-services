import { Repository } from 'typeorm';
import { AppDataSource } from '../data-source';
import { createError } from '../utils';
import { publishUserRegistered } from '../events/producers/institutionRegistered.producer';
import logger from '../config/logger';



class PatientRecordService {

  constructor() {
  }

 

}

export default PatientRecordService;
