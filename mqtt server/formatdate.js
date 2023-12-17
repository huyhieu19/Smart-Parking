import { format } from 'date-fns';


const currentTime = new Date();
export const formattedTime = format(currentTime, 'yyyy-MM-dd HH:mm:ss');

