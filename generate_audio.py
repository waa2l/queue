#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script to generate Arabic audio files for the queue management system
"""

import os
from gtts import gTTS
import pygame

def create_audio_folder():
    """Create audio folder if it doesn't exist"""
    audio_folder = "audio"
    if not os.path.exists(audio_folder):
        os.makedirs(audio_folder)
    return audio_folder

def to_arabic_number(num):
    """Convert number to Arabic numerals"""
    arabic_numbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
    return ''.join(arabic_numbers[int(digit)] for digit in str(num))

def generate_number_audios():
    """Generate audio files for numbers 1-200"""
    audio_folder = create_audio_folder()
    
    print("Generating number audio files...")
    
    # Generate numbers 1-200
    for i in range(1, 201):
        text = f"على العميل رقم {i}"
        tts = gTTS(text=text, lang='ar')
        filename = os.path.join(audio_folder, f"{i}.mp3")
        tts.save(filename)
        print(f"Generated: {filename}")
    
    print("Number audio files generated successfully!")

def generate_clinic_audios():
    """Generate clinic audio files"""
    audio_folder = create_audio_folder()
    
    clinics = {
        1: "التوجه إلى عيادة طب الأسرة",
        2: "التوجه إلى عيادة الباطنة", 
        3: "التوجه إلى عيادة الأطفال",
        4: "التوجه إلى عيادة الأسنان",
        5: "التوجه إلى عيادة النساء والتوليد",
        6: "التوجه إلى عيادة الجلدية",
        7: "التوجه إلى عيادة الأنف والأذن",
        8: "التوجه إلى عيادة العيون",
        9: "التوجه إلى عيادة القلب",
        10: "التوجه إلى عيادة الجراحة"
    }
    
    print("Generating clinic audio files...")
    
    for clinic_num, text in clinics.items():
        tts = gTTS(text=text, lang='ar')
        filename = os.path.join(audio_folder, f"clinic{clinic_num}.mp3")
        tts.save(filename)
        print(f"Generated: {filename}")
    
    print("Clinic audio files generated successfully!")

def generate_instant_audios():
    """Generate instant message audio files"""
    audio_folder = create_audio_folder()
    
    messages = [
        "اهلاً وسهلاً بكم فى المركز رجاء الانتظار بالاستراحه",
        "نرحب بكم وسيتم الاتصال بكم قريباً",
        "شكراً لانتظاركم، سنقوم بخدمتكم في أقرب وقت",
        "نرجو منكم الانتظار قليلاً، سيتم النداء عليكم",
        "مرحباً بكم في مركزنا، الرجاء الجلوس في منطقة الانتظار"
    ]
    
    print("Generating instant message audio files...")
    
    for i, text in enumerate(messages, 1):
        tts = gTTS(text=text, lang='ar')
        filename = os.path.join(audio_folder, f"instant{i}.mp3")
        tts.save(filename)
        print(f"Generated: {filename}")
    
    print("Instant message audio files generated successfully!")

def generate_ding_sound():
    """Generate ding sound"""
    audio_folder = create_audio_folder()
    
    # Create a simple ding sound using pygame
    try:
        pygame.mixer.init()
        
        # Create a simple beep sound
        frequency = 800  # Hz
        duration = 200  # milliseconds
        
        # For now, we'll use a placeholder
        # In a real implementation, you'd generate the actual sound
        print("Note: Ding sound should be created separately or downloaded")
        
    except:
        print("Could not generate ding sound - pygame not available")

def main():
    """Main function to generate all audio files"""
    print("Starting audio file generation...")
    print("=" * 50)
    
    try:
        generate_number_audios()
        print()
        generate_clinic_audios()
        print()
        generate_instant_audios()
        print()
        generate_ding_sound()
        
        print("=" * 50)
        print("All audio files generated successfully!")
        print("Files saved in the 'audio' folder")
        
    except Exception as e:
        print(f"Error generating audio files: {e}")
        print("Please install required packages: pip install gtts pygame")

if __name__ == "__main__":
    main()