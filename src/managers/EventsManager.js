import Event from "../objects/Event";
import check from "./Manager";
import { db } from "../firebase";
import { doc, getDoc, setDoc, updateDoc, arrayRemove, deleteDoc, arrayUnion, getDocs, collection } from "firebase/firestore/lite";
import { eventConverter, eventRequestConverter } from "../helpers/Converters";


class EventsManager {
    constructor(){
     if(! EventsManager._eventM){
       EventsManager._eventM = this;
     }
     return EventsManager._eventM;
    }

    getInstance(){
        return EventsManager._eventM;
    }
    
    
    async addEvent(eventName, eventDate, eventTime, eventDuration, eventDescription, eventQuota, eventLocation, eventClub, eventAdvisor, advisorReview, isOpen){
        const event = new Event(eventDate,eventTime, eventLocation, eventName, eventClub, eventQuota, eventAdvisor, eventDescription, eventDuration, advisorReview, isOpen);
        try{
            const ref = doc(collection(db,'events')).withConverter(eventConverter);
            event.setId(ref.id);
            await setDoc(ref, event);
            return true;
        } catch (err) {
            console.error(err);
            alert(err.message);
            return false;
        }
    }
    
    async deleteEvent(eventId){
        try {
            await deleteDoc(doc(db, 'events', eventId));
        }
        catch (e) {
            console.log("Failed " + e);
        }
    }

    async addStudentToEvent(eventId, studentMail){
        const eventRef = doc(db, 'events', eventId).withConverter(eventConverter);
        const docEvent = await getDoc(eventRef);
        if (docEvent.exists()){
            const event = docEvent.data();
            const eventQuota = event.getQuota() - 1;
            const participants = event.getParticipants();
            participants.push(studentMail);
            await updateDoc(eventRef, { participants: participants }).then(() => {
                updateDoc(eventRef, { quota: eventQuota});
            });
        } else {
            console.log("No document");
        }
    }

    async removeStudentFromEvent(eventId, studentMail){
        const eventRef = doc(db, 'events', eventId).withConverter(eventConverter);
        const docEvent = await getDoc(eventRef);
        console.log(docEvent.data())
        if (docEvent.exists()){
            const event = docEvent.data();
            const eventQuota = event.getQuota() + 1;
            await updateDoc(eventRef, { participants: arrayRemove(studentMail) }).then(() => {
                updateDoc(eventRef, { quota: eventQuota});
            });
        } else {
            console.log("No document");
        }
    }

    async approveEventRequest(eventId){
        const eventReqRef = doc(db, 'eventRequests', eventId).withConverter(eventRequestConverter);
        const docEvent = await getDoc(eventReqRef).then(() => {
            if (docEvent.exists()){
                const eventRequest = docEvent.data();
                const id = eventRequest.getId();;
                const eventRef = doc(db, 'events', id).withConverter(eventConverter);
                const newEvent = new Event(eventRequest.getId(), eventRequest.getDateRequested(),eventRequest.getTimeRequested(), 
                                            eventRequest.getLocation(), 
                                            eventRequest.getName(), 
                                            eventRequest.getClub(), 
                                            eventRequest.getQuota(), 
                                            eventRequest.getClubAdvisor(), 
                                            eventRequest.getDescription(), 
                                            eventRequest.getDuration(), 
                                            eventRequest.getAdvisorReview(),
                                            eventRequest.getIsOpen());
                updateDoc(eventReqRef, { confirmed: true }).then(() => {
                    setDoc(eventRef, newEvent);
                });
            } else {
                console.log("No document");
            }
        });
        
    } 

    async declineEventRequest(eventId){
        const eventReqRef = doc(db, 'eventRequests', eventId).withConverter(eventRequestConverter);
        const docEvent = await getDoc(eventReqRef);
        if (docEvent.exists()){
            await deleteDoc(eventReqRef);
        } else {
            console.log("No document");
        }
    }
    async getAllEvents(){
        var events = []
        const eventRef = await getDocs(collection(db, 'events').withConverter(eventConverter));
        eventRef.forEach((doc) => {
            events.push(doc.data());
        });
        return events;
    }

    async getAllEventRequests() {
        var eventReqs = []
        const eventRef = await getDocs(collection(db, 'eventRequests').withConverter(eventRequestConverter));
        eventRef.forEach((doc) => {
            if( !doc.data().getConfirmed())
                eventReqs.push(doc.data());
        });
        return eventReqs;
    }
  }
  
  
const eventManager_instance = new EventsManager();
if (check(eventManager_instance)){
  Object.freeze(eventManager_instance);  
    
}


export default eventManager_instance;